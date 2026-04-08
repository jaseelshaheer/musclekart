import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../../controllers/user/payment.controller.js";

const router = express.Router();

router.post("/payments/razorpay/order", protect, createRazorpayOrder);
router.post("/payments/razorpay/verify", protect, verifyRazorpayPayment);

export default router;
