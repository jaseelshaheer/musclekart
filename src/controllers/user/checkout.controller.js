import HTTP_STATUS from "../../constants/httpStatus.js";
import { getCheckoutPageService, placeOrderService } from "../../services/user/checkout.service.js";

export const getCheckoutPage = async (req, res) => {
  res.render("user/checkout/checkout", {
    layout: "layouts/user",
    activePage: "checkout",
    errorMessage: ""
  });
};

export const getCheckoutData = async (req, res) => {
  try {
    const result = await getCheckoutPageService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to load checkout"
    });
  }
};


export const placeOrder = async (req, res) => {
  try {
    const result = await placeOrderService(req.user.id, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order placed successfully",
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to place order"
    });
  }
};

