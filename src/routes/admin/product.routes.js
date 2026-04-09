import express from "express";

import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { validateProductPayload } from "../../middlewares/validateProduct.middleware.js";

import upload from "../../config/multer.js";

import {
  renderProductsPage,
  renderCreateProductPage,
  renderEditProductPage,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus
} from "../../controllers/admin/product.controller.js";

const router = express.Router();

router.get("/products-list", renderProductsPage);
router.get("/products/create", renderCreateProductPage);
router.get("/products/:productId/edit", renderEditProductPage);

router.get("/products", adminAuth, getProducts);
router.get("/products/:productId", adminAuth, getProductById);

const uploadFields = upload.fields([
  { name: "main_images", maxCount: 10 },
  { name: "gallery_images", maxCount: 30 }
]);

router.post("/products", adminAuth, uploadFields, validateProductPayload, createProduct);

router.patch(
  "/products/:productId",
  adminAuth,
  uploadFields,
  validateProductPayload,
  updateProduct
);

router.delete("/products/:productId", adminAuth, deleteProduct);

router.patch("/products/:productId/status", adminAuth, toggleProductStatus);

export default router;
