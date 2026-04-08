import crypto from "crypto";
import razorpay from "../../config/razorpay.js";
import Address from "../../models/address.model.js";
import Cart from "../../models/cart.model.js";
import Coupon from "../../models/coupon.model.js";
import Order from "../../models/order.model.js";
import Payment from "../../models/payment.model.js";
import Variant from "../../models/variant.model.js";
import { getCartService } from "./cart.service.js";


import User from "../../models/user.model.js";
import { creditWalletService } from "./wallet.service.js";


function generateOrderId() {
  const timestamp = Date.now();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `MKORD-${timestamp}-${randomPart}`;
}


async function grantReferralRewardIfEligible(userId, order) {
  const user = await User.findById(userId);

  if (!user || !user.referred_by || user.referral_reward_granted) {
    return;
  }

  const completedOrdersCount = await Order.countDocuments({
    user_id: userId,
    order_status: { $ne: "cancelled" }
  });

  if (completedOrdersCount !== 1) {
    return;
  }

  const referralRewardAmount = 100;

  await creditWalletService({
    userId: user.referred_by,
    amount: referralRewardAmount,
    description: `Referral reward for first order ${order.order_id}`,
    source: "referral_reward",
    orderId: order._id
  });

  user.referral_reward_granted = true;
  await user.save();
}


async function getCheckoutSnapshot(userId, addressId) {
  if (!addressId) {
    throw new Error("Please select a delivery address");
  }

  const cartData = await getCartService(userId);

  if (!cartData.items.length) {
    throw new Error("Your cart is empty");
  }

  if (cartData.hasUnavailableItems) {
    throw new Error("Remove unavailable or out-of-stock items before checkout");
  }

  const address = await Address.findOne({
    _id: addressId,
    user: userId
  }).lean();

  if (!address) {
    throw new Error("Address not found");
  }

  for (const item of cartData.items) {
    const variant = await Variant.findOne({
      _id: item.variant_id,
      isDeleted: false,
      isActive: true
    }).lean();

    if (!variant) {
      throw new Error("One or more items are unavailable");
    }

    if (variant.stock_qty < item.quantity) {
      throw new Error(`Insufficient stock for ${item.product_name}`);
    }
  }

  const cart = await Cart.findOne({ user_id: userId }).lean();
  let appliedCoupon = null;
  const discount = cart?.coupon_discount || 0;

  if (cart?.applied_coupon_id) {
    appliedCoupon = await Coupon.findById(cart.applied_coupon_id).lean();
  }

  const shipping = 0;
  const tax = 0;
  const finalTotal = Math.max(0, cartData.subtotal + shipping + tax - discount);

  return {
    cart,
    cartData,
    address,
    appliedCoupon,
    shipping,
    tax,
    discount,
    finalTotal
  };
}

async function finalizePaidOrder({
  userId,
  address,
  checkoutData,
  paymentMethod,
  transactionId
}) {
  const orderId = generateOrderId();

  const order = await Order.create({
    order_id: orderId,
    user_id: userId,
    order_date: new Date(),
    order_status: "order_placed",
    payment_method: paymentMethod,
    payment_status: "paid",
    subtotal: checkoutData.cartData.subtotal,
    delivery_charge: checkoutData.shipping,
    discount: checkoutData.discount,
    grand_total: checkoutData.finalTotal,
    address_id: address._id,
    coupon_id: checkoutData.cart?.applied_coupon_id || null,
    return_reject_reason: "",
    address_snapshot: {
      name: address.name,
      phone: address.phone,
      house: address.house,
      country: address.country,
      district: address.district,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
      address_type: address.addressType
    },
    items: checkoutData.cartData.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      main_image: item.main_image || "",
      quantity: item.quantity,
      price: item.unitPrice,
      original_price: item.originalPrice || item.unitPrice,
      discount_amount: item.discountAmount || 0,
      total: item.itemTotal,
      item_status: "active",
      cancel_reason: "",
      return_reason: "",
      return_reject_reason: "",
      attributes: item.attributes || []
    })),
    status_history: [
      {
        status: "order_placed",
        changed_at: new Date(),
        note: "Order has been placed successfully"
      }
    ]
  });

  await Payment.create({
    order_id: order._id,
    method: paymentMethod,
    status: "completed",
    transaction_id: transactionId || "",
    paid_at: new Date()
  });

  for (const item of checkoutData.cartData.items) {
    const variant = await Variant.findById(item.variant_id);
    if (variant) {
      variant.stock_qty -= item.quantity;
      await variant.save();
    }
  }

  await Cart.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        cart_items: [],
        applied_coupon_id: null,
        coupon_discount: 0
      }
    }
  );

  if (checkoutData.cart?.applied_coupon_id) {
    await Coupon.findByIdAndUpdate(checkoutData.cart.applied_coupon_id, {
      $inc: { used_count: 1 }
    });
  }

  return order;
}

export const createRazorpayOrderService = async (userId, payload) => {
  const { addressId } = payload;

  const checkoutData = await getCheckoutSnapshot(userId, addressId);

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(checkoutData.finalTotal * 100),
    currency: "INR",
    receipt: `rcpt_${Date.now()}`
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
    checkout: {
      addressId,
      finalTotal: checkoutData.finalTotal
    }
  };
};

export const verifyRazorpayPaymentService = async (userId, payload) => {
  const {
    addressId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = payload;

  if (!addressId) {
    throw new Error("Address is required");
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error("Incomplete payment verification data");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new Error("Payment signature verification failed");
  }

  const checkoutData = await getCheckoutSnapshot(userId, addressId);

  const order = await finalizePaidOrder({
    userId,
    address: checkoutData.address,
    checkoutData,
    paymentMethod: "card",
    transactionId: razorpay_payment_id
  });

  await grantReferralRewardIfEligible(userId, order);

  return {
    orderId: order.order_id
  };
};
