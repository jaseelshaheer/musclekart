import HTTP_STATUS from "../../constants/httpStatus.js";
import {
  getAdminOrdersService,
  getAdminOrderDetailService,
  updateAdminOrderStatusService,
  approveReturnRequestService,
  rejectReturnRequestService
} from "../../services/admin/adminOrder.service.js";

export const getOrdersPage = async (req, res) => {
  res.render("admin/orders", {
    layout: "layouts/layout",
    activePage: "orders"
  });
};

export const getOrders = async (req, res) => {
  try {
    const result = await getAdminOrdersService(req.query);

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
  res.render("admin/order-detail", {
    layout: "layouts/layout",
    activePage: "orders",
    order: null,
    orderId: req.params.orderId,
    errorMessage: ""
  });
};

export const getOrderDetailData = async (req, res) => {
  try {
    const order = await getAdminOrderDetailService(req.params.orderId);

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

export const updateOrderStatus = async (req, res) => {
  try {
    const result = await updateAdminOrderStatusService(req.params.orderId, req.body.status);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order status updated successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to update order status"
    });
  }
};

export const approveReturnRequest = async (req, res) => {
  try {
    const order = await approveReturnRequestService(req.params.orderId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Return request approved successfully",
      data: order
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to approve return request"
    });
  }
};

export const rejectReturnRequest = async (req, res) => {
  try {
    const order = await rejectReturnRequestService(req.params.orderId, req.body.reason);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Return request rejected successfully",
      data: order
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to reject return request"
    });
  }
};
