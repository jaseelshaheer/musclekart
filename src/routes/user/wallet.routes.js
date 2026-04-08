import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getWalletPage,
  getWalletData
} from "../../controllers/user/wallet.controller.js";

const router = express.Router();

router.get("/wallet", getWalletPage);
router.get("/wallet/data", protect, getWalletData);

export default router;
