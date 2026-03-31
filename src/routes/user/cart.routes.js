import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getCartPage,
  getCartData,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from "../../controllers/user/cart.controller.js";

const router = express.Router();

router.get("/cart", getCartPage);

router.get("/cart/data", protect, getCartData);
router.post("/cart", protect, addToCart);
router.patch("/cart/:variantId", protect, updateCartItemQuantity);
router.delete("/cart/:variantId", protect, removeCartItem);
router.delete("/cart", protect, clearCart);

export default router;
