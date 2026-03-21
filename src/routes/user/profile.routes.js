import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { getProfile, updateProfile, requestEmailChange, verifyEmailChange, changePassword, addAddress, updateAddress, deleteAddress, getAddresses, setDefaultAddress} from "../../controllers/user/profile.controller.js";
import upload from "../../config/multer.js";
import { validateAddress } from "../../middlewares/validateAddress.middleware.js";
// import userAuth from "../../middlewares/userAuth.middleware.js";
import { emailOtpLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch("/profile/email", protect, emailOtpLimiter, requestEmailChange);
router.post("/profile/email/verify", protect, verifyEmailChange);
router.patch("/profile/change-password", protect, changePassword);
router.post("/address", protect, validateAddress, addAddress);
router.patch("/address/:addressId", protect, validateAddress, updateAddress);
router.delete("/address/:addressId", protect, deleteAddress);
router.get("/address", protect, getAddresses);
router.patch("/address/:addressId/default", protect, setDefaultAddress);
router.patch(
  "/profile/edit",
  protect,
  upload.single("profileImage"),
  updateProfile
);

export default router;
