import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getCheckoutPage,
  getCheckoutData,
  placeOrder
} from "../../controllers/user/checkout.controller.js";

const router = express.Router();

router.get("/checkout", getCheckoutPage);
router.get("/checkout/data", protect, getCheckoutData);
router.post("/checkout", protect, placeOrder);


export default router;
