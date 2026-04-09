import Cart from "../../models/cart.model.js";
import Address from "../../models/address.model.js";
import Variant from "../../models/variant.model.js";
import Order from "../../models/order.model.js";
import Payment from "../../models/payment.model.js";
import { getCartService } from "./cart.service.js";
import Coupon from "../../models/coupon.model.js";
import { getOrCreateWallet, debitWalletService } from "./wallet.service.js";
import User from "../../models/user.model.js";
import { creditWalletService } from "./wallet.service.js";

function generateOrderId() {
  const timestamp = Date.now();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `MKORD-${timestamp}-${randomPart}`;
}

export const getCheckoutPageService = async (userId) => {
  const cartData = await getCartService(userId);

  const addresses = await Address.find({ user: userId })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();

  const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0] || null;

  const shipping = 0;
  const tax = 0;

  const cart = await Cart.findOne({ user_id: userId }).lean();
  let appliedCoupon = null;
  const discount = cart?.coupon_discount || 0;

  const itemOfferSavings = cartData.items.reduce(
    (sum, item) => sum + Number((item.discountAmount || 0) * (item.quantity || 0)),
    0
  );

  const totalSavings = itemOfferSavings + Number(discount || 0);

  if (cart?.applied_coupon_id) {
    appliedCoupon = await Coupon.findById(cart.applied_coupon_id).lean();
  }

  const finalTotal = Math.max(0, cartData.subtotal + shipping + tax - discount);

  const canCheckout =
    cartData.items.length > 0 && !cartData.hasUnavailableItems && Boolean(defaultAddress);

  const wallet = await getOrCreateWallet(userId);

  return {
    items: cartData.items,
    subtotal: cartData.subtotal,
    totalItems: cartData.totalItems,
    hasUnavailableItems: cartData.hasUnavailableItems,
    walletBalance: wallet.balance,
    addresses,
    defaultAddress,
    shipping,
    tax,
    discount,
    itemOfferSavings,
    totalSavings,
    finalTotal,
    appliedCoupon,
    canCheckout
  };
};

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

export const placeOrderService = async (userId, payload) => {
  const { addressId, paymentMethod = "cod" } = payload;

  if (!addressId) {
    throw new Error("Please select a delivery address");
  }

  if (!["cod", "wallet"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  const checkoutData = await getCheckoutPageService(userId);

  if (!checkoutData.items.length) {
    throw new Error("Your cart is empty");
  }

  if (checkoutData.hasUnavailableItems) {
    throw new Error("Remove unavailable or out-of-stock items before checkout");
  }

  const address = await Address.findOne({
    _id: addressId,
    user: userId
  }).lean();

  if (!address) {
    throw new Error("Address not found");
  }

  for (const item of checkoutData.items) {
    const variant = await Variant.findOne({
      _id: item.variant_id,
      isDeleted: false,
      isActive: true
    });

    if (!variant) {
      throw new Error("One or more items are unavailable");
    }

    if (variant.stock_qty < item.quantity) {
      throw new Error(`Insufficient stock for ${item.product_name}`);
    }
  }

  if (paymentMethod === "wallet") {
    const wallet = await getOrCreateWallet(userId);

    if (wallet.balance < checkoutData.finalTotal) {
      throw new Error("Insufficient wallet balance");
    }
  }

  const orderId = generateOrderId();
  const cart = await Cart.findOne({ user_id: userId }).lean();

  const order = await Order.create({
    order_id: orderId,
    user_id: userId,
    order_date: new Date(),
    order_status: "order_placed",
    payment_method: paymentMethod,
    payment_status: paymentMethod === "wallet" ? "paid" : "pending",
    subtotal: checkoutData.subtotal,
    delivery_charge: checkoutData.shipping,
    discount: checkoutData.discount,
    grand_total: checkoutData.finalTotal,
    address_id: address._id,
    coupon_id: cart?.applied_coupon_id || null,
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
    items: checkoutData.items.map((item) => ({
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
    status: paymentMethod === "wallet" ? "completed" : "pending",
    transaction_id: "",
    paid_at: paymentMethod === "wallet" ? new Date() : null
  });

  if (paymentMethod === "wallet") {
    await debitWalletService({
      userId,
      amount: checkoutData.finalTotal,
      description: `Wallet payment for order ${order.order_id}`,
      source: "wallet_payment",
      orderId: order._id
    });
  }

  for (const item of checkoutData.items) {
    const variant = await Variant.findById(item.variant_id);
    variant.stock_qty -= item.quantity;
    await variant.save();
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

  if (cart?.applied_coupon_id) {
    await Coupon.findByIdAndUpdate(cart.applied_coupon_id, {
      $inc: { used_count: 1 }
    });
  }

  await grantReferralRewardIfEligible(userId, order);

  return {
    orderId: order.order_id
  };
};
