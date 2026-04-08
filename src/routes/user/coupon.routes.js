import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getAvailableCoupons,
  applyCoupon,
  removeCoupon
} from "../../controllers/user/coupon.controller.js";

const router = express.Router();

router.get("/coupons/data", protect, getAvailableCoupons);
router.post("/checkout/coupon/apply", protect, applyCoupon);
router.delete("/checkout/coupon", protect, removeCoupon);

export default router;
