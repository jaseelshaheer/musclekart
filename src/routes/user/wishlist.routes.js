import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getWishlistPage,
  getWishlistData,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} from "../../controllers/user/wishlist.controller.js";

const router = express.Router();

router.get("/wishlist", getWishlistPage);
router.get("/wishlist/data", protect, getWishlistData);
router.post("/wishlist", protect, addToWishlist);
router.delete("/wishlist/:productId", protect, removeFromWishlist);
router.delete("/wishlist", protect, clearWishlist);

export default router;
