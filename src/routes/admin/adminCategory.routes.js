import express from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import {getCategories, createCategory, updateCategory, deleteCategory, renderCategoriesPage, toggleCategoryStatus } from "../../controllers/admin/category.controller.js";

const router = express.Router();


router.get("/categories-list", renderCategoriesPage);

router.get("/categories", adminAuth, getCategories);
router.post("/categories", adminAuth, createCategory);
router.patch("/categories/:categoryId", adminAuth, updateCategory);
router.delete("/categories/:categoryId", adminAuth, deleteCategory);
router.patch("/categories/:categoryId/status", adminAuth, toggleCategoryStatus);

export default router;