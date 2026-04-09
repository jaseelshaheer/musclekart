import express from "express";
import {
  getProductsPage,
  getProductsData,
  getProductDetailsPage
} from "../../controllers/user/shop.controller.js";

const router = express.Router();

router.get("/shop", getProductsPage);
router.get("/shop/data", getProductsData);
router.get("/shop/:productId", getProductDetailsPage);

export default router;
