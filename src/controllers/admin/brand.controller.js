import {
  createBrandService,
  getBrandsService,
  updateBrandService,
  deleteBrandService,
  toggleBrandStatusService
} from "../../services/brand.service.js";

import HTTP_STATUS from "../../constants/httpStatus.js";


export const renderBrandsPage = (req, res) => {
  res.render("admin/brands", {
    activePage: "brands"
  });
};


export const getBrands = async (req, res) => {

  try {

    const result = await getBrandsService(req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });

  } catch (error) {

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });

  }

};


export const createBrand = async (req, res) => {

  try {

    const brand = await createBrandService(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: brand
    });

  } catch (error) {

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });

  }

};


export const updateBrand = async (req, res) => {

  try {

    const { brandId } = req.params;

    const brand = await updateBrandService(brandId, req.body);

    res.json({
      success: true,
      data: brand
    });

  } catch (error) {

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });

  }

};


export const deleteBrand = async (req, res) => {

  try {

    const { brandId } = req.params;

    await deleteBrandService(brandId);

    res.json({ success: true });

  } catch (error) {

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });

  }

};


export const toggleBrandStatus = async (req, res) => {

  try {

    const { brandId } = req.params;

    const brand = await toggleBrandStatusService(brandId);

    res.json({
      success: true,
      data: brand
    });

  } catch (error) {

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message
    });

  }

};