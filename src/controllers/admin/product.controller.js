import HTTP_STATUS from "../../constants/httpStatus.js";
import { COMMON_MESSAGES } from "../../constants/messages.js";

import {
  getProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  toggleProductStatusService
} from "../../services/admin/product.service.js";

export const renderProductsPage = (req, res) => {

  res.render("admin/products", {
    activePage: "products"
  });

};

export const renderCreateProductPage = (req, res) => {
  res.render("admin/product-form", {
    activePage: "products",
    mode: "create",
    productId: ""
  });
};

export const renderEditProductPage = (req, res) => {
  res.render("admin/product-form", {
    activePage: "products",
    mode: "edit",
    productId: req.params.productId
  });
};



export const getProducts = async (req, res) => {

  try {

    const { page, limit, search } = req.query;

    const result = await getProductsService({
      page,
      limit,
      search
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });

  } catch (error) {

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: COMMON_MESSAGES.SOMETHING_WENT_WRONG
    });

  }

};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await getProductByIdService(productId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};




export const createProduct = async (req, res) => {

  try {

    const product = await createProductService(
      req.body,
      req.files
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: product
    });

  } catch (error) {

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });

  }

};



export const updateProduct = async (req, res) => {

  try {

    const { productId } = req.params;

    const updated = await updateProductService(
      productId,
      req.body,
      req.files
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated
    });

  } catch (error) {

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });

  }

};



export const deleteProduct = async (req, res) => {

  try {

    const { productId } = req.params;

    await deleteProductService(productId);

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



export const toggleProductStatus = async (req, res) => {

  try {

    const { productId } = req.params;

    const result = await toggleProductStatusService(productId);

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
