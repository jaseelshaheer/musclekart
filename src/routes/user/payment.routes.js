import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  markRazorpayPaymentFailed
} from "../../controllers/user/payment.controller.js";

const router = express.Router();

router.post("/payments/razorpay/order", protect, createRazorpayOrder);
router.post("/payments/razorpay/verify", protect, verifyRazorpayPayment);
router.post("/payments/razorpay/failure", protect, markRazorpayPaymentFailed);

export default router;
