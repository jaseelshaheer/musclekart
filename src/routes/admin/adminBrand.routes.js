import express from "express";

import { adminAuth } from "../../middlewares/adminAuth.middleware.js";

import {
  renderBrandsPage,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus
} from "../../controllers/admin/brand.controller.js";

const router = express.Router();

router.get("/brands-list", renderBrandsPage);

router.get("/brands", adminAuth, getBrands);

router.post("/brands", adminAuth, createBrand);

router.patch("/brands/:brandId", adminAuth, updateBrand);

router.delete("/brands/:brandId", adminAuth, deleteBrand);

router.patch("/brands/:brandId/status", adminAuth, toggleBrandStatus);

export default router;