import HTTP_STATUS from "../../constants/httpStatus.js";
import {
  getWishlistService,
  addToWishlistService,
  removeFromWishlistService,
  clearWishlistService
} from "../../services/user/wishlist.service.js";

export const getWishlistPage = async (req, res) => {
  res.render("user/wishlist/wishlist", {
    layout: "layouts/user",
    activePage: "wishlist",
    errorMessage: ""
  });
};

export const getWishlistData = async (req, res) => {
  try {
    const result = await getWishlistService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to load wishlist"
    });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      throw new Error("Product id is required");
    }

    await addToWishlistService(req.user.id, productId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Added to wishlist"
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to add to wishlist"
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    await removeFromWishlistService(req.user.id, req.params.productId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Removed from wishlist"
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to remove from wishlist"
    });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    await clearWishlistService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Wishlist cleared"
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to clear wishlist"
    });
  }
};
