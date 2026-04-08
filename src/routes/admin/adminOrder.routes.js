import express from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import {
  getOrdersPage,
  getOrders,
  getOrderDetailPage,
  getOrderDetailData,
  updateOrderStatus,
  approveReturnRequest,
  rejectReturnRequest
} from "../../controllers/admin/adminOrder.controller.js";

const router = express.Router();

router.get("/orders-page", getOrdersPage);
router.get("/orders", adminAuth, getOrders);
router.get("/orders/:orderId", getOrderDetailPage);
router.get("/orders/:orderId/data", adminAuth, getOrderDetailData);
router.patch("/orders/:orderId/status", adminAuth, updateOrderStatus);
router.patch("/orders/:orderId/approve-return", adminAuth, approveReturnRequest);
router.patch("/orders/:orderId/reject-return", adminAuth, rejectReturnRequest);

export default router;
