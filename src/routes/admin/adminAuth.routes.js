import express from "express";
import { loginAdmin } from "../../controllers/admin/adminAuth.controller.js";
const router = express.Router();


router.post("/auth/login", loginAdmin);

export default router