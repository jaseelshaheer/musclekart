import Cart from "../../models/cart.model.js";
import Coupon from "../../models/coupon.model.js";
import Order from "../../models/order.model.js";
import { getCartService } from "./cart.service.js";
import User from "../../models/user.model.js";

const REFERRAL_WELCOME_COUPON_CODE = "REFWELCOME100";

function isReferralWelcomeCoupon(coupon) {
  return String(coupon?.coupon_code || "").toUpperCase() === REFERRAL_WELCOME_COUPON_CODE;
}

function getComputedCouponStatus(coupon) {
  const now = new Date();

  if (!coupon.is_active) return "inactive";
  if (now < new Date(coupon.start_date)) return "scheduled";
  if (now > new Date(coupon.expiry_date)) return "expired";

  return "active";
}

function calculateCouponDiscount(coupon, subtotal) {
  if (coupon.discount_type === "flat") {
    return Number(coupon.discount_value);
  }

  const rawDiscount = (subtotal * Number(coupon.discount_value)) / 100;

  if (coupon.max_discount > 0) {
    return Math.min(rawDiscount, Number(coupon.max_discount));
  }

  return rawDiscount;
}

async function validateCouponForUser(userId, coupon, subtotal) {
  if (!coupon) {
    throw new Error("Coupon not found");
  }

  const computedStatus = getComputedCouponStatus(coupon);
  if (computedStatus !== "active") {
    throw new Error(`Coupon is ${computedStatus}`);
  }

  if (subtotal < coupon.min_purchase) {
    throw new Error(`Minimum purchase of Rs. ${coupon.min_purchase} required`);
  }

  if (coupon.used_count >= coupon.usage_limit) {
    throw new Error("Coupon usage limit reached");
  }

  if (isReferralWelcomeCoupon(coupon)) {
    const user = await User.findById(userId).lean();

    if (!user?.referred_by) {
      throw new Error("This welcome coupon is only for referred users");
    }

    const successfulOrdersCount = await Order.countDocuments({
      user_id: userId,
      order_status: { $nin: ["cancelled"] }
    });

    if (successfulOrdersCount > 0) {
      throw new Error("Referral welcome coupon is valid only for first order");
    }
  }

  const userUsageCount = await Order.countDocuments({
    user_id: userId,
    coupon_id: coupon._id,
    order_status: { $nin: ["cancelled"] }
  });

  if (userUsageCount >= coupon.usage_per_user) {
    throw new Error("You have already used this coupon maximum allowed times");
  }
}

export const getAvailableCouponsService = async (userId) => {
  const cartData = await getCartService(userId);
  const subtotal = cartData.subtotal;

  const coupons = await Coupon.find({}).sort({ created_at: -1 }).lean();

  const availableCoupons = [];

  const user = await User.findById(userId).lean();

  const successfulOrdersCount = await Order.countDocuments({
    user_id: userId,
    order_status: { $nin: ["cancelled"] }
  });

  for (const coupon of coupons) {
    const computedStatus = getComputedCouponStatus(coupon);

    if (isReferralWelcomeCoupon(coupon)) {
      if (!user?.referred_by) continue;
      if (successfulOrdersCount > 0) continue;
    }

    if (computedStatus !== "active") continue;
    if (subtotal < coupon.min_purchase) continue;
    if (coupon.used_count >= coupon.usage_limit) continue;

    const userUsageCount = await Order.countDocuments({
      user_id: userId,
      coupon_id: coupon._id,
      order_status: { $nin: ["cancelled"] }
    });

    if (userUsageCount >= coupon.usage_per_user) continue;

    availableCoupons.push({
      ...coupon,
      computed_status: computedStatus
    });
  }

  return availableCoupons;
};

export const applyCouponService = async (userId, code) => {
  if (!code?.trim()) {
    throw new Error("Coupon code is required");
  }

  const cart = await Cart.findOne({ user_id: userId });
  if (!cart || !cart.cart_items.length) {
    throw new Error("Cart is empty");
  }

  if (cart.applied_coupon_id) {
    throw new Error("Only one coupon can be applied at a time");
  }

  const cartData = await getCartService(userId);
  const coupon = await Coupon.findOne({
    coupon_code: code.trim().toUpperCase()
  }).lean();

  await validateCouponForUser(userId, coupon, cartData.subtotal);

  const discount = calculateCouponDiscount(coupon, cartData.subtotal);

  cart.applied_coupon_id = coupon._id;
  cart.coupon_discount = discount;
  await cart.save();

  return {
    coupon,
    discount
  };
};

export const removeCouponService = async (userId) => {
  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  cart.applied_coupon_id = null;
  cart.coupon_discount = 0;
  await cart.save();

  return true;
};
