import Category from "../models/category.model.js";
import { CATEGORY_MESSAGES } from "../constants/messages.js";

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

    const category = await Category.create({
        name,
        description
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
        isDeleted: false
    });

    if (existingCategory) {
        throw new Error(CATEGORY_MESSAGES.NAME_EXISTS_EDIT);
    }

    const category = await Category.findByIdAndUpdate(
        id,
        {
            name,
            description,
            isActive
        },
        { new: true }
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









