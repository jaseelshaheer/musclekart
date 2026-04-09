import {
  getProductsPageService,
  getProductDetailsPageService
} from "../../services/user/shop.service.js";
import HTTP_STATUS from "../../constants/httpStatus.js";

export const getProductsPage = async (req, res) => {
  try {
    const result = await getProductsPageService(req.query);

    res.render("user/product/shop-list", {
      layout: "layouts/user",
      activePage: "shop",
      notice: req.query.notice || "",
      ...result
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).render("user/product/shop-list", {
      layout: "layouts/user",
      activePage: "shop",
      notice: "",
      products: [],
      categories: [],
      brands: [],
      filters: {
        search: "",
        sort: "",
        category: "",
        brand: "",
        minPrice: "",
        maxPrice: "",
        page: 1
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 12
      },
      errorMessage: error.message || "Failed to load products"
    });
  }
};

export const getProductsData = async (req, res) => {
  try {
    const result = await getProductsPageService(req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to load products"
    });
  }
};

export const getProductDetailsPage = async (req, res) => {
  try {
    const result = await getProductDetailsPageService(req.params.productId);

    res.render("user/product/shop-detail", {
      layout: "layouts/user",
      activePage: "shop",
      ...result
    });
  } catch{
    return res.redirect("/shop?notice=This product is unavailable");
  }
};
