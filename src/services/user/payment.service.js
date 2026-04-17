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
    payment_status: "paid",
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

async function createPendingOnlineOrderFromCheckout({ userId, address, checkoutData }) {
  const orderId = generateOrderId();

  const order = await Order.create({
    order_id: orderId,
    user_id: userId,
    order_date: new Date(),
    order_status: "pending",
    payment_method: "card",
    payment_status: "pending",
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
        status: "pending",
        changed_at: new Date(),
        note: "Order created. Awaiting payment completion"
      }
    ]
  });

  await Payment.create({
    order_id: order._id,
    method: "card",
    status: "pending",
    transaction_id: "",
    paid_at: null
  });

  return order;
}

async function finalizePendingOrderAfterPayment(order, razorpayPaymentId) {
  if (order.payment_status === "paid") {
    return order;
  }

  order.payment_status = "paid";
  order.order_status = "order_placed";
  order.status_history.push({
    status: "order_placed",
    changed_at: new Date(),
    note: "Payment successful via Razorpay"
  });
  await order.save();

  const payment = await Payment.findOne({ order_id: order._id });
  if (payment) {
    payment.status = "completed";
    payment.transaction_id = razorpayPaymentId || "";
    payment.paid_at = new Date();
    await payment.save();
  } else {
    await Payment.create({
      order_id: order._id,
      method: "card",
      status: "completed",
      transaction_id: razorpayPaymentId || "",
      paid_at: new Date()
    });
  }

  for (const item of order.items) {
    const variant = await Variant.findById(item.variant_id);
    if (variant) {
      variant.stock_qty = Math.max(0, Number(variant.stock_qty || 0) - Number(item.quantity || 0));
      await variant.save();
    }
  }

  await Cart.findOneAndUpdate(
    { user_id: order.user_id },
    {
      $set: {
        cart_items: [],
        applied_coupon_id: null,
        coupon_discount: 0
      }
    }
  );

  if (order.coupon_id) {
    await Coupon.findByIdAndUpdate(order.coupon_id, {
      $inc: { used_count: 1 }
    });
  }

  return order;
}

export const createRazorpayOrderService = async (userId, payload) => {
  const { addressId, orderId } = payload || {};
  let order;

  if (orderId) {
    order = await Order.findOne({
      user_id: userId,
      order_id: orderId
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.payment_method !== "card") {
      throw new Error("Retry is available only for online payments");
    }

    if (order.order_status === "cancelled") {
      throw new Error("Cancelled order cannot be retried");
    }

    if (order.payment_status === "paid") {
      throw new Error("Payment is already completed for this order");
    }
  } else {
    const checkoutData = await getCheckoutSnapshot(userId, addressId);
    order = await createPendingOnlineOrderFromCheckout({
      userId,
      address: checkoutData.address,
      checkoutData
    });
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(Number(order.grand_total || 0) * 100),
    currency: "INR",
    receipt: `rcpt_${Date.now()}`
  });

  await Payment.findOneAndUpdate(
    { order_id: order._id },
    {
      $set: {
        method: "card",
        status: "processing",
        transaction_id: razorpayOrder.id,
        paid_at: null
      }
    },
    { upsert: true }
  );

  order.payment_status = "pending";
  order.order_status = "pending";
  order.status_history.push({
    status: "pending",
    changed_at: new Date(),
    note: "Payment initiated via Razorpay"
  });
  await order.save();

  return {
    orderId: order.order_id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
    checkout: {
      addressId: String(order.address_id || ""),
      finalTotal: Number(order.grand_total || 0)
    }
  };
};

export const verifyRazorpayPaymentService = async (userId, payload) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

  if (!orderId) {
    throw new Error("Order ID is required");
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

  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.payment_method !== "card") {
    throw new Error("Invalid payment method for retry");
  }

  if (order.order_status === "cancelled") {
    throw new Error("Cancelled order cannot be paid");
  }

  await finalizePendingOrderAfterPayment(order, razorpay_payment_id);

  await grantReferralRewardIfEligible(userId, order);

  return {
    orderId: order.order_id
  };
};

export const markRazorpayPaymentFailedService = async (userId, payload) => {
  const { orderId } = payload || {};

  if (!orderId) {
    throw new Error("Order ID is required");
  }

  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.payment_status === "paid") {
    return {
      orderId: order.order_id
    };
  }

  if (order.order_status === "cancelled") {
    throw new Error("Cancelled order cannot be retried");
  }

  order.payment_status = "failed";
  order.order_status = "pending";
  order.status_history.push({
    status: "pending",
    changed_at: new Date(),
    note: "Payment failed. Retry available."
  });
  await order.save();

  const payment = await Payment.findOne({ order_id: order._id });
  if (payment) {
    payment.status = "failed";
    await payment.save();
  }

  return {
    orderId: order.order_id
  };
};
