import Coupon from "../../models/coupon.model.js";

function normalizeCouponCode(code = "") {
  return code.trim().toUpperCase();
}

function validateCouponPayload(payload) {
  const {
    coupon_code,
    description,
    min_purchase,
    discount_type,
    discount_value,
    usage_limit,
    usage_per_user,
    max_discount,
    start_date,
    expiry_date
  } = payload;

  if (!coupon_code?.trim()) {
    throw new Error("Coupon code is required");
  }

  if (!description?.trim()) {
    throw new Error("Description is required");
  }

  if (!["flat", "percentage"].includes(discount_type)) {
    throw new Error("Invalid discount type");
  }

  if (Number(min_purchase) < 0) {
    throw new Error("Minimum purchase must be 0 or more");
  }

  if (Number(discount_value) <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  if (discount_type === "percentage" && Number(discount_value) > 100) {
    throw new Error("Percentage discount cannot exceed 100");
  }

  if (Number(usage_limit) <= 0) {
    throw new Error("Usage limit must be greater than 0");
  }

  if (Number(usage_per_user) <= 0) {
    throw new Error("Usage per user must be greater than 0");
  }

  if (Number(usage_per_user) > Number(usage_limit)) {
    throw new Error("Usage per user cannot exceed total usage limit");
  }

  if (Number(max_discount) < 0) {
    throw new Error("Max discount cannot be negative");
  }

  if (!start_date) {
    throw new Error("Start date is required");
  }

  if (!expiry_date) {
    throw new Error("Expiry date is required");
  }

  const startDate = new Date(start_date);
  const expiryDate = new Date(expiry_date);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(expiryDate.getTime())) {
    throw new Error("Invalid coupon date");
  }

  if (expiryDate <= startDate) {
    throw new Error("Expiry date must be after start date");
  }
}

export const getAdminCouponsService = async (query = {}) => {
  const {
    search = "",
    page = 1,
    limit = 10
  } = query;

  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const match = {};

  if (search?.trim()) {
    match.coupon_code = { $regex: search.trim(), $options: "i" };
  }

  const totalCoupons = await Coupon.countDocuments(match);

  const coupons = await Coupon.find(match)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  const mappedCoupons = coupons.map((coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const expiryDate = new Date(coupon.expiry_date);

    let computed_status = "active";

    if (!coupon.is_active) {
      computed_status = "inactive";
    } else if (now < startDate) {
      computed_status = "scheduled";
    } else if (now > expiryDate) {
      computed_status = "expired";
    }

    return {
      ...coupon,
      computed_status
    };
  });

  return {
    coupons: mappedCoupons,
    totalCoupons,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalCoupons / limitNumber)
  };
};


export const createCouponService = async (payload) => {
  validateCouponPayload(payload);

  const couponCode = normalizeCouponCode(payload.coupon_code);

  const existingCoupon = await Coupon.findOne({ coupon_code: couponCode });
  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  const coupon = await Coupon.create({
    coupon_code: couponCode,
    is_active: true,
    description: payload.description.trim(),
    min_purchase: Number(payload.min_purchase),
    discount_type: payload.discount_type,
    discount_value: Number(payload.discount_value),
    usage_limit: Number(payload.usage_limit),
    usage_per_user: Number(payload.usage_per_user),
    used_count: 0,
    max_discount: Number(payload.max_discount || 0),
    start_date: new Date(payload.start_date),
    expiry_date: new Date(payload.expiry_date)
  });

  return coupon;
};


export const getCouponByIdService = async (couponId) => {
  const coupon = await Coupon.findById(couponId).lean();

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
};



export const toggleCouponStatusService = async (couponId) => {
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  coupon.is_active = !coupon.is_active;
  await coupon.save();

  return coupon;
};


export const updateCouponService = async (couponId, payload) => {
  validateCouponPayload(payload);

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  const couponCode = normalizeCouponCode(payload.coupon_code);

  const existingCoupon = await Coupon.findOne({
    coupon_code: couponCode,
    _id: { $ne: couponId }
  });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  coupon.coupon_code = couponCode;
  coupon.description = payload.description.trim();
  coupon.min_purchase = Number(payload.min_purchase);
  coupon.discount_type = payload.discount_type;
  coupon.discount_value = Number(payload.discount_value);
  coupon.usage_limit = Number(payload.usage_limit);
  coupon.usage_per_user = Number(payload.usage_per_user);
  coupon.max_discount =
    payload.discount_type === "percentage"
      ? Number(payload.max_discount || 0)
      : 0;
  coupon.start_date = new Date(payload.start_date);
  coupon.expiry_date = new Date(payload.expiry_date);

  await coupon.save();

  return coupon;
};


export const deleteCouponService = async (couponId) => {
  const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

  if (!deletedCoupon) {
    throw new Error("Coupon not found");
  }

  return deletedCoupon;
};
