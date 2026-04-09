import HTTP_STATUS from "../../constants/httpStatus.js";
import {
  getAdminCouponsService,
  createCouponService,
  getCouponByIdService,
  updateCouponService,
  toggleCouponStatusService,
  deleteCouponService
} from "../../services/admin/adminCoupon.service.js";

export const getCouponsPage = async (req, res) => {
  res.render("admin/coupons", {
    layout: "layouts/layout",
    activePage: "coupons"
  });
};

export const getCouponsData = async (req, res) => {
  try {
    const result = await getAdminCouponsService(req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to load coupons"
    });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await createCouponService(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to create coupon"
    });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await getCouponByIdService(req.params.couponId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: error.message || "Coupon not found"
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await updateCouponService(req.params.couponId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to update coupon"
    });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await toggleCouponStatusService(req.params.couponId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Coupon ${coupon.is_active ? "activated" : "deactivated"} successfully`,
      data: coupon
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to update coupon status"
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await deleteCouponService(req.params.couponId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to delete coupon"
    });
  }
};
