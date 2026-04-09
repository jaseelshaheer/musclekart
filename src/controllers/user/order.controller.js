import HTTP_STATUS from "../../constants/httpStatus.js";
import {
  getUserOrdersService,
  getUserOrderByOrderIdService,
  cancelOrderService,
  cancelOrderItemService,
  returnOrderService,
  returnOrderItemService,
  getUserOrderInvoiceService
} from "../../services/user/order.service.js";
import { generateInvoicePdf } from "../../utils/generateInvoice.js";

export const getOrderSuccessPage = async (req, res) => {
  const { orderId } = req.params;

  res.render("user/order/order-success", {
    layout: "layouts/user",
    activePage: "orders",
    orderId
  });
};

export const getOrdersPage = async (req, res) => {
  res.render("user/order/order-list", {
    layout: "layouts/user",
    activePage: "orders",
    errorMessage: ""
  });
};

export const getOrdersData = async (req, res) => {
  try {
    const result = await getUserOrdersService(req.user.id, req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to load orders"
    });
  }
};

export const getOrderDetailPage = async (req, res) => {
  res.render("user/order/order-detail", {
    layout: "layouts/user",
    activePage: "orders",
    order: null,
    orderId: req.params.orderId,
    errorMessage: ""
  });
};

export const getOrderDetailData = async (req, res) => {
  try {
    const order = await getUserOrderByOrderIdService(req.user.id, req.params.orderId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: error.message || "Order not found"
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const result = await cancelOrderService(req.user.id, req.params.orderId, req.body.reason);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order cancelled successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to cancel order"
    });
  }
};

export const cancelOrderItem = async (req, res) => {
  try {
    const result = await cancelOrderItemService(
      req.user.id,
      req.params.orderId,
      Number(req.params.itemIndex),
      req.body.reason
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order item cancelled successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to cancel item"
    });
  }
};

export const returnOrder = async (req, res) => {
  try {
    const result = await returnOrderService(req.user.id, req.params.orderId, req.body.reason);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Return request submitted successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to return order"
    });
  }
};

export const returnOrderItem = async (req, res) => {
  try {
    const result = await returnOrderItemService(
      req.user.id,
      req.params.orderId,
      Number(req.params.itemIndex),
      req.body.reason
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Return request submitted successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to return item"
    });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const order = await getUserOrderInvoiceService(req.user.id, req.params.orderId);
    generateInvoicePdf(order, res);
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: error.message || "Failed to download invoice"
    });
  }
};
