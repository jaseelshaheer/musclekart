import Category from "../models/category.model.js";
import { CATEGORY_MESSAGES } from "../constants/messages.js";

function parseBooleanFlag(value) {
  return value === true || value === "true";
}

function validateCategoryOfferFields(payload) {
  const {
    offer_discount_type,
    offer_discount_value,
    offer_start_date,
    offer_expiry_date,
  } = payload;

  const offerIsActive = parseBooleanFlag(payload.offer_is_active);

  if (!offerIsActive) {
    return;
  }

  if (!["flat", "percentage"].includes(offer_discount_type)) {
    throw new Error("Invalid category offer discount type");
  }

  if (Number(offer_discount_value) <= 0) {
    throw new Error("Category offer discount value must be greater than 0");
  }

  if (
    offer_discount_type === "percentage" &&
    Number(offer_discount_value) > 100
  ) {
    throw new Error("Category percentage offer cannot exceed 100");
  }

  if (!offer_start_date || !offer_expiry_date) {
    throw new Error("Category offer start and expiry dates are required");
  }

  if (new Date(offer_expiry_date) <= new Date(offer_start_date)) {
    throw new Error("Category offer expiry date must be after start date");
  }
}


export const createCategoryService = async (data) => {

    const { name, description } = data;

    if (!data.name || !data.name.trim()) {
      throw new Error(CATEGORY_MESSAGES.NAME_REQUIRED);
    }

    if (data.name.trim().length > 50) {
      throw new Error("Category name must be 50 characters or fewer");
    }

    if (data.description && data.description.trim().length > 200) {
      throw new Error("Category description must be 200 characters or fewer");
    }

    const existingCategory = await Category.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        isDeleted: false
    });

    if (existingCategory) {
        throw new Error(CATEGORY_MESSAGES.NAME_EXISTS);
    }

    validateCategoryOfferFields(data);

    const offerIsActive = parseBooleanFlag(data.offer_is_active);

    const category = await Category.create({
      name,
      description,
      offer_discount_type: data.offer_discount_type || null,
      offer_discount_value: Number(data.offer_discount_value || 0),
      offer_start_date: data.offer_start_date || null,
      offer_expiry_date: data.offer_expiry_date || null,
      offer_is_active: offerIsActive,
    });


    return category;
};



export const getCategoriesService = async (query) => {

    const page = parseInt(query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const search = query.search || "";

    const filter = {
        isDeleted: false,
        name: { $regex: search, $options: "i" }
    };

    const categories = await Category.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Category.countDocuments(filter);

    return {
        categories,
        totalCategories: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
    };
};



export const updateCategoryService = async (id, data) => {
  const { name, description, isActive } = data;

  if (!data.name || !data.name.trim()) {
    throw new Error(CATEGORY_MESSAGES.NAME_REQUIRED);
  }

  if (data.name.trim().length > 50) {
    throw new Error("Category name must be 50 characters or fewer");
  }

  if (data.description && data.description.trim().length > 200) {
    throw new Error("Category description must be 200 characters or fewer");
  }

  const existingCategory = await Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
    _id: { $ne: id },
    isDeleted: false,
  });

  if (existingCategory) {
    throw new Error(CATEGORY_MESSAGES.NAME_EXISTS_EDIT);
  }

  validateCategoryOfferFields(data);

  const offerIsActive = parseBooleanFlag(data.offer_is_active);

  const category = await Category.findByIdAndUpdate(
    id,
    {
      name,
      description,
      isActive,
      offer_discount_type: data.offer_discount_type || null,
      offer_discount_value: Number(data.offer_discount_value || 0),
      offer_start_date: data.offer_start_date || null,
      offer_expiry_date: data.offer_expiry_date || null,
      offer_is_active: offerIsActive,
    },
    { new: true },
  );

  return category;
};



export const deleteCategoryService = async (id) => {

    const category = await Category.findByIdAndUpdate(
        id,
        {
            isDeleted: true,
            deletedAt: new Date()
        },
        { new: true }
    );

    return category;
};



export const toggleCategoryStatusService = async (id) => {

    const category = await Category.findById(id);

    if (!category) {
        throw new Error(CATEGORY_MESSAGES.NOT_FOUND);
    }

    category.isActive = !category.isActive;

    await category.save();

    return category;
};











