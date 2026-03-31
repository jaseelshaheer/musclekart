import HTTP_STATUS from "../../constants/httpStatus.js";
import { CART_MESSAGES } from "../../constants/messages.js";
import {
  getCartService,
  addToCartService,
  updateCartItemQuantityService,
  removeCartItemService,
  clearCartService
} from "../../services/user/cart.service.js";

export const getCartPage = async (req, res) => {
  res.render("user/cart/cart", {
    layout: "layouts/user",
    activePage: "cart",
    items: [],
    subtotal: 0,
    totalItems: 0,
    hasUnavailableItems: false,
    errorMessage: ""
  });
};


export const getCartData = async (req, res) => {
  try {
    const result = await getCartService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;

    await addToCartService(req.user.id, productId, variantId, quantity);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: CART_MESSAGES.ITEM_ADDED
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { action } = req.body;
    const { variantId } = req.params;

    await updateCartItemQuantityService(req.user.id, variantId, action);

    res.status(HTTP_STATUS.OK).json({
      success: true
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { variantId } = req.params;

    await removeCartItemService(req.user.id, variantId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: CART_MESSAGES.ITEM_REMOVED
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    await clearCartService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: CART_MESSAGES.CART_CLEARED
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};
