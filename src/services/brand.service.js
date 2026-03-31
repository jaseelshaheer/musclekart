import Brand from "../models/brand.model.js";
import { BRAND_MESSAGES } from "../constants/messages.js";

/* CREATE BRAND */

export const createBrandService = async (data) => {

  const { name } = data;

  if (!data.name || !data.name.trim()) {
    throw new Error(BRAND_MESSAGES.NAME_REQUIRED);
  }

  if (data.name.trim().length > 50) {
    throw new Error("Brand name must be 50 characters or fewer");
  }


  const existing = await Brand.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
    isDeleted: false
  });

  if (existing) {
    throw new Error(BRAND_MESSAGES.NAME_EXISTS);
  }

  const brand = await Brand.create({ name });

  return brand;
};


/* GET BRANDS */

export const getBrandsService = async (query) => {

  const page = parseInt(query.page) || 1;
  const limit = 10;

  const skip = (page - 1) * limit;

  const search = query.search || "";

  const filter = {
    isDeleted: false,
    name: { $regex: search, $options: "i" }
  };

  const brands = await Brand.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Brand.countDocuments(filter);

  return {
    brands,
    totalBrands: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };

};


/* UPDATE BRAND */

export const updateBrandService = async (id, data) => {

  const { name } = data;

  const existing = await Brand.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
    _id: { $ne: id },
    isDeleted: false
  });


  if (!data.name || !data.name.trim()) {
    throw new Error(BRAND_MESSAGES.NAME_REQUIRED);
  }

  if (data.name.trim().length > 50) {
    throw new Error("Brand name must be 50 characters or fewer");
  }

  if (existing) {
    throw new Error(BRAND_MESSAGES.NAME_EXISTS);
  }
  

  const brand = await Brand.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  );

  return brand;

};


/* SOFT DELETE BRAND */

export const deleteBrandService = async (id) => {

  const brand = await Brand.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date()
    },
    { new: true }
  );

  return brand;

};


/* TOGGLE BRAND STATUS */

export const toggleBrandStatusService = async (id) => {

  const brand = await Brand.findById(id);

  if (!brand) {
    throw new Error(BRAND_MESSAGES.NOT_FOUND);
  }

  brand.status = !brand.status;

  await brand.save();

  return brand;

};