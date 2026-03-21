import express from "express";
// import { getUsers } from "../../../controllers/admin/user.controller.js";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { updateUserStatus, getUsers } from "../../controllers/admin/user.controller.js";


const router = express.Router();

router.get("/users", adminAuth, getUsers);
router.patch(
  "/users/:userId/status",
  adminAuth,
  updateUserStatus
);

export default router;