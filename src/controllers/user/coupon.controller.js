import HTTP_STATUS from "../../constants/httpStatus.js";
import {
  getAvailableCouponsService,
  applyCouponService,
  removeCouponService
} from "../../services/user/coupon.service.js";

export const getAvailableCoupons = async (req, res) => {
  try {
    const coupons = await getAvailableCouponsService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: coupons
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to load coupons"
    });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const result = await applyCouponService(req.user.id, req.body.code);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Coupon applied successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to apply coupon"
    });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    await removeCouponService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Coupon removed successfully"
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to remove coupon"
    });
  }
};
