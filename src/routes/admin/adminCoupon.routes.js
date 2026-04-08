import express from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import {
  getCouponsPage,
  getCouponsData,
  createCoupon,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon
} from "../../controllers/admin/adminCoupon.controller.js";

const router = express.Router();

router.get("/coupons", getCouponsPage);
router.get("/coupons/data", adminAuth, getCouponsData);
router.get("/coupons/:couponId", adminAuth, getCouponById);
router.post("/coupons", adminAuth, createCoupon);
router.patch("/coupons/:couponId/toggle-status", adminAuth, toggleCouponStatus);
router.patch("/coupons/:couponId", adminAuth, updateCoupon);
router.delete("/coupons/:couponId", adminAuth, deleteCoupon);

export default router;
