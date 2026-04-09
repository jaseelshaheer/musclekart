import HTTP_STATUS from "../../constants/httpStatus.js";
import { COMMON_MESSAGES } from "../../constants/messages.js";

import {
  getCategoriesService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  toggleCategoryStatusService
} from "../../services/category.service.js";

export const renderCategoriesPage = (req, res) => {
  res.render("admin/categories", {
    activePage: "categories"
  });
};

export const getCategories = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const result = await getCategoriesService({
      page,
      limit,
      search
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch{
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: COMMON_MESSAGES.SOMETHING_WENT_WRONG
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await createCategoryService(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const updated = await updateCategoryService(categoryId, req.body);

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

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    await deleteCategoryService(categoryId);

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

export const toggleCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await toggleCategoryStatusService(categoryId);

    res.json({
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
