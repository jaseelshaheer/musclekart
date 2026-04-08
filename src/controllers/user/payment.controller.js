import HTTP_STATUS from "../../constants/httpStatus.js";
import {
  createRazorpayOrderService,
  verifyRazorpayPaymentService
} from "../../services/user/payment.service.js";

export const createRazorpayOrder = async (req, res) => {
  try {
    const result = await createRazorpayOrderService(req.user.id, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to create Razorpay order"
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const result = await verifyRazorpayPaymentService(req.user.id, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Payment verified successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to verify payment"
    });
  }
};
