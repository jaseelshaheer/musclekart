import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";

import cloudinary from "../../config/cloudinary.js";
import { PRODUCT_MESSAGES } from "../../constants/messages.js";

function parseBooleanFlag(value) {
  return value === true || value === "true";
}

function validateProductOfferFields(payload) {
  const {
    offer_discount_type,
    offer_discount_value,
    offer_start_date,
    offer_expiry_date,
    offer_min_final_price
  } = payload;

  const offerIsActive = parseBooleanFlag(payload.offer_is_active);

  if (!offerIsActive) {
    return;
  }

  if (!["flat", "percentage"].includes(offer_discount_type)) {
    throw new Error("Invalid product offer discount type");
  }

  if (Number(offer_discount_value) <= 0) {
    throw new Error("Product offer discount value must be greater than 0");
  }

  if (offer_discount_type === "percentage" && Number(offer_discount_value) > 100) {
    throw new Error("Product percentage offer cannot exceed 100");
  }

  if (!offer_start_date || !offer_expiry_date) {
    throw new Error("Product offer start and expiry dates are required");
  }

  if (new Date(offer_expiry_date) <= new Date(offer_start_date)) {
    throw new Error("Product offer expiry date must be after start date");
  }

  if (Number(offer_min_final_price || 0) < 0) {
    throw new Error("Minimum final price cannot be negative");
  }
}

function uploadImage(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "musclekart/products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export const getProductsService = async ({ page = 1, limit = 10, search = "" }) => {
  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage = {
    isDeleted: false,
    product_name: { $regex: search, $options: "i" }
  };

  const products = await Product.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "variants",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$product_id", "$$productId"] },
              isDeleted: false
            }
          }
        ],
        as: "variants"
      }
    },

    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category"
      }
    },

    {
      $lookup: {
        from: "brands",
        localField: "brand_id",
        foreignField: "_id",
        as: "brand"
      }
    },

    {
      $addFields: {
        category: { $arrayElemAt: ["$category", 0] },
        brand: { $arrayElemAt: ["$brand", 0] },

        min_price: { $min: "$variants.price" },

        max_price: { $max: "$variants.price" },

        total_stock: { $sum: "$variants.stock_qty" },

        main_image: { $arrayElemAt: ["$variants.main_image", 0] }
      }
    },

    {
      $project: {
        product_name: 1,
        isActive: 1,
        category: "$category.name",
        brand: "$brand.name",
        min_price: 1,
        max_price: 1,
        total_stock: 1,
        main_image: 1,
        createdAt: 1
      }
    },

    { $sort: { createdAt: -1 } },

    { $skip: skip },

    { $limit: limitNumber }
  ]);

  const totalProducts = await Product.countDocuments(matchStage);

  return {
    products,
    totalProducts,
    currentPage: Number(pageNumber),
    totalPages: Math.ceil(totalProducts / limitNumber)
  };
};

export const getProductByIdService = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false
  }).lean();

  if (!product) {
    throw new Error(PRODUCT_MESSAGES.NOT_FOUND);
  }

  const variants = await Variant.find({
    product_id: productId,
    isDeleted: false
  })
    .sort({ createdAt: 1 })
    .lean();

  return {
    ...product,
    variants
  };
};

export const createProductService = async (data, files) => {
  const { product_name, description, specifications, category_id, brand_id } = data;

  const parsedVariants = JSON.parse(data.variants);

  if (!Array.isArray(parsedVariants) || !parsedVariants.length) {
    throw new Error(PRODUCT_MESSAGES.AT_LEAST_ONE_VARIANT);
  }

  if (!product_name?.trim()) {
    throw new Error(PRODUCT_MESSAGES.NAME_REQUIRED);
  }

  if (!category_id) {
    throw new Error(PRODUCT_MESSAGES.CATEGORY_REQUIRED);
  }

  if (!brand_id) {
    throw new Error(PRODUCT_MESSAGES.BRAND_REQUIRED);
  }

  validateProductOfferFields(data);

  const offerIsActive = parseBooleanFlag(data.offer_is_active);

  const product = await Product.create({
    product_name,
    description,
    specifications,
    category_id,
    brand_id,
    offer_discount_type: data.offer_discount_type || null,
    offer_discount_value: Number(data.offer_discount_value || 0),
    offer_start_date: data.offer_start_date || null,
    offer_expiry_date: data.offer_expiry_date || null,
    offer_is_active: offerIsActive,
    offer_min_final_price: Number(data.offer_min_final_price || 0)
  });

  const mainImages = files.main_images || [];
  const galleryImages = files.gallery_images || [];

  let mainIndex = 0;
  let galleryIndex = 0;

  const variantDocs = await Promise.all(
    parsedVariants.map(async (v) => {
      let mainImageUrl = v.existing_main_image || null;

      if (v.has_new_main_image && mainImages[mainIndex]) {
        mainImageUrl = await uploadImage(mainImages[mainIndex].buffer);
        mainIndex++;
      }

      const galleryUrls = [];

      for (let i = 0; i < v.new_gallery_count; i++) {
        if (galleryImages[galleryIndex]) {
          const url = await uploadImage(galleryImages[galleryIndex].buffer);

          galleryUrls.push(url);

          galleryIndex++;
        }
      }

      const totalImages = (mainImageUrl ? 1 : 0) + galleryUrls.length;

      if (totalImages < 3) {
        throw new Error(PRODUCT_MESSAGES.MIN_VARIANT_IMAGES);
      }

      return {
        product_id: product._id,
        price: v.price,
        stock_qty: v.stock,
        main_image: mainImageUrl,
        gallery_images: galleryUrls,
        attributes: v.attributes
      };
    })
  );

  await Variant.insertMany(variantDocs);

  return product;
};

export const updateProductService = async (productId, data, files) => {
  const { product_name, description, specifications, category_id, brand_id, isActive } = data;

  const parsedVariants = JSON.parse(data.variants);

  if (!Array.isArray(parsedVariants) || !parsedVariants.length) {
    throw new Error(PRODUCT_MESSAGES.AT_LEAST_ONE_VARIANT);
  }

  const existingProduct = await Product.findOne({
    product_name: { $regex: `^${product_name}$`, $options: "i" },
    _id: { $ne: productId },
    isDeleted: false
  });

  if (existingProduct) {
    throw new Error(PRODUCT_MESSAGES.NAME_EXISTS);
  }

  if (!product_name?.trim()) {
    throw new Error(PRODUCT_MESSAGES.NAME_REQUIRED);
  }

  if (!category_id) {
    throw new Error(PRODUCT_MESSAGES.CATEGORY_REQUIRED);
  }

  if (!brand_id) {
    throw new Error(PRODUCT_MESSAGES.BRAND_REQUIRED);
  }

  validateProductOfferFields(data);

  const offerIsActive = parseBooleanFlag(data.offer_is_active);

  const product = await Product.findByIdAndUpdate(
    productId,
    {
      product_name,
      description,
      specifications,
      category_id,
      brand_id,
      isActive,
      offer_discount_type: data.offer_discount_type || null,
      offer_discount_value: Number(data.offer_discount_value || 0),
      offer_start_date: data.offer_start_date || null,
      offer_expiry_date: data.offer_expiry_date || null,
      offer_is_active: offerIsActive,
      offer_min_final_price: Number(data.offer_min_final_price || 0)
    },
    { new: true }
  );

  if (!product) {
    throw new Error(PRODUCT_MESSAGES.NOT_FOUND);
  }

  const existingVariants = await Variant.find({
    product_id: productId,
    isDeleted: false
  });

  const mainImages = files.main_images || [];
  const galleryImages = files.gallery_images || [];

  let mainIndex = 0;
  let galleryIndex = 0;

  const keptVariantIds = new Set();

  for (const v of parsedVariants) {
    let mainImageUrl = v.existing_main_image || null;

    if (v.has_new_main_image && mainImages[mainIndex]) {
      mainImageUrl = await uploadImage(mainImages[mainIndex].buffer);
      mainIndex++;
    }

    const galleryUrls = [...(v.existing_gallery_images || [])];

    for (let i = 0; i < v.new_gallery_count; i++) {
      if (galleryImages[galleryIndex]) {
        const url = await uploadImage(galleryImages[galleryIndex].buffer);
        galleryUrls.push(url);
        galleryIndex++;
      }
    }

    const totalImages = (mainImageUrl ? 1 : 0) + galleryUrls.length;

    if (totalImages < 3) {
      throw new Error(PRODUCT_MESSAGES.MIN_VARIANT_IMAGES);
    }

    if (v._id) {
      const existingVariant = existingVariants.find(
        (variant) => String(variant._id) === String(v._id)
      );

      if (existingVariant) {
        existingVariant.price = v.price;
        existingVariant.stock_qty = v.stock;
        existingVariant.main_image = mainImageUrl;
        existingVariant.gallery_images = galleryUrls;
        existingVariant.attributes = v.attributes;
        existingVariant.isDeleted = false;
        existingVariant.deletedAt = null;

        await existingVariant.save();
        keptVariantIds.add(String(existingVariant._id));
        continue;
      }
    }

    const newVariant = await Variant.create({
      product_id: productId,
      price: v.price,
      stock_qty: v.stock,
      main_image: mainImageUrl,
      gallery_images: galleryUrls,
      attributes: v.attributes
    });

    keptVariantIds.add(String(newVariant._id));
  }

  for (const variant of existingVariants) {
    if (!keptVariantIds.has(String(variant._id))) {
      variant.isDeleted = true;
      variant.deletedAt = new Date();
      await variant.save();
    }
  }

  return product;
};

export const deleteProductService = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    {
      isDeleted: true,
      deletedAt: new Date()
    },
    { new: true }
  );

  await Variant.updateMany(
    { product_id: productId },
    {
      isDeleted: true,
      deletedAt: new Date()
    }
  );

  return product;
};

export const toggleProductStatusService = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false
  });

  if (!product) {
    throw new Error(PRODUCT_MESSAGES.NOT_FOUND);
  }

  product.isActive = !product.isActive;

  await product.save();

  return product;
};
