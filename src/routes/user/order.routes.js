import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getOrderSuccessPage,
  getOrdersPage,
  getOrdersData,
  getOrderDetailPage,
  getOrderDetailData,
  cancelOrder,
  cancelOrderItem,
  returnOrder,
  returnOrderItem,
  downloadInvoice
} from "../../controllers/user/order.controller.js";

const router = express.Router();

router.get("/orders/success/:orderId", getOrderSuccessPage);

router.get("/orders", getOrdersPage);
router.get("/orders/data", protect, getOrdersData);
router.get("/orders/:orderId", getOrderDetailPage);
router.get("/orders/:orderId/data", protect, getOrderDetailData);
router.patch("/orders/:orderId/cancel", protect, cancelOrder);
router.patch("/orders/:orderId/items/:itemIndex/cancel", protect, cancelOrderItem);
router.patch("/orders/:orderId/return", protect, returnOrder);
router.patch("/orders/:orderId/items/:itemIndex/return", protect, returnOrderItem);
router.get("/orders/:orderId/invoice", protect, downloadInvoice);

export default router;
