import mongoose from "mongoose";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import Brand from "../../models/brand.model.js";
import { PRODUCT_MESSAGES } from "../../constants/messages.js";

function isOfferActive(entity) {
  if (!entity?.offer_is_active) return false;
  if (!entity?.offer_discount_type) return false;
  if (Number(entity?.offer_discount_value || 0) <= 0) return false;
  if (!entity?.offer_start_date || !entity?.offer_expiry_date) return false;

  const now = new Date();
  const start = new Date(entity.offer_start_date);
  const expiry = new Date(entity.offer_expiry_date);

  return now >= start && now <= expiry;
}

function applyOfferToPrice(basePrice, discountType, discountValue) {
  const price = Number(basePrice || 0);
  const value = Number(discountValue || 0);

  if (price <= 0 || value <= 0) {
    return {
      finalPrice: price,
      discountAmount: 0
    };
  }

  let discountAmount = 0;

  if (discountType === "percentage") {
    discountAmount = (price * value) / 100;
  } else if (discountType === "flat") {
    discountAmount = value;
  }

  const finalPrice = Math.max(price - discountAmount, 0);

  return {
    finalPrice,
    discountAmount: Math.min(discountAmount, price)
  };
}

function applyProductPriceFloor(basePrice, offerResult, minFinalPrice) {
  if (!offerResult) return null;

  const price = Number(basePrice || 0);
  const floor = Number(minFinalPrice || 0);

  const adjustedFinalPrice = Math.max(Number(offerResult.finalPrice || 0), floor);
  const adjustedDiscountAmount = Math.max(price - adjustedFinalPrice, 0);

  return {
    ...offerResult,
    finalPrice: adjustedFinalPrice,
    discountAmount: adjustedDiscountAmount
  };
}

function getBestOfferForPrice({ basePrice, product, category }) {
  const productHasOffer = isOfferActive(product);
  const categoryHasOffer = isOfferActive(category);

  const minFinalPrice = Number(product?.offer_min_final_price || 0);

  const productOfferResult = productHasOffer
    ? applyProductPriceFloor(
        basePrice,
        applyOfferToPrice(basePrice, product.offer_discount_type, product.offer_discount_value),
        minFinalPrice
      )
    : null;

  const categoryOfferResult = categoryHasOffer
    ? applyProductPriceFloor(
        basePrice,
        applyOfferToPrice(basePrice, category.offer_discount_type, category.offer_discount_value),
        minFinalPrice
      )
    : null;

  let selected = null;

  if (productOfferResult && categoryOfferResult) {
    selected =
      productOfferResult.discountAmount >= categoryOfferResult.discountAmount
        ? {
            source: "product",
            discountType: product.offer_discount_type,
            discountValue: Number(product.offer_discount_value || 0),
            ...productOfferResult
          }
        : {
            source: "category",
            discountType: category.offer_discount_type,
            discountValue: Number(category.offer_discount_value || 0),
            ...categoryOfferResult
          };
  } else if (productOfferResult) {
    selected = {
      source: "product",
      discountType: product.offer_discount_type,
      discountValue: Number(product.offer_discount_value || 0),
      ...productOfferResult
    };
  } else if (categoryOfferResult) {
    selected = {
      source: "category",
      discountType: category.offer_discount_type,
      discountValue: Number(category.offer_discount_value || 0),
      ...categoryOfferResult
    };
  }

  if (!selected) {
    return {
      hasOffer: false,
      originalPrice: Number(basePrice || 0),
      finalPrice: Number(basePrice || 0),
      discountAmount: 0,
      source: null,
      discountType: null,
      discountValue: 0
    };
  }

  return {
    hasOffer: Number(selected.discountAmount || 0) > 0,
    originalPrice: Number(basePrice || 0),
    finalPrice: Number(selected.finalPrice || basePrice || 0),
    discountAmount: Number(selected.discountAmount || 0),
    source: selected.source,
    discountType: selected.discountType,
    discountValue: selected.discountValue
  };
}

export const getProductsPageService = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const search = (query.search || "").trim();
  const sort = (query.sort || "").trim();
  const category = (query.category || "").trim();
  const brand = (query.brand || "").trim();
  const minPrice =
    query.minPrice !== undefined && query.minPrice !== "" ? Number(query.minPrice) : null;
  const maxPrice =
    query.maxPrice !== undefined && query.maxPrice !== "" ? Number(query.maxPrice) : null;

  const productMatch = {
    isDeleted: false,
    isActive: true
  };

  if (search) {
    productMatch.product_name = { $regex: search, $options: "i" };
  }

  if (category && mongoose.Types.ObjectId.isValid(category)) {
    productMatch.category_id = new mongoose.Types.ObjectId(category);
  }

  if (brand && mongoose.Types.ObjectId.isValid(brand)) {
    productMatch.brand_id = new mongoose.Types.ObjectId(brand);
  }

  const pipeline = [
    { $match: productMatch },

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
      $lookup: {
        from: "variants",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$product_id", "$$productId"] },
              isDeleted: false,
              isActive: true
            }
          }
        ],
        as: "variants"
      }
    },

    {
      $addFields: {
        category: { $arrayElemAt: ["$category", 0] },
        brand: { $arrayElemAt: ["$brand", 0] },
        min_price: { $min: "$variants.price" },
        max_price: { $max: "$variants.price" },
        total_stock: { $sum: "$variants.stock_qty" },
        main_image: { $arrayElemAt: ["$variants.main_image", 0] },
        variant_count: { $size: "$variants" },
        single_variant_id: {
          $cond: [
            { $eq: [{ $size: "$variants" }, 1] },
            { $arrayElemAt: ["$variants._id", 0] },
            null
          ]
        },
        variant_options: {
          $map: {
            input: "$variants",
            as: "variant",
            in: {
              _id: "$$variant._id",
              price: "$$variant.price",
              stock_qty: "$$variant.stock_qty",
              main_image: "$$variant.main_image",
              attributes: "$$variant.attributes"
            }
          }
        }
      }
    },

    {
      $match: {
        "category.isDeleted": false,
        "category.isActive": true,
        variants: { $ne: [] }
      }
    }
  ];

  if (brand) {
    pipeline.push({
      $match: {
        "brand.isDeleted": false,
        "brand.status": true
      }
    });
  } else {
    pipeline.push({
      $match: {
        $or: [
          { brand: null },
          {
            "brand.isDeleted": false,
            "brand.status": true
          }
        ]
      }
    });
  }

  if (minPrice !== null || maxPrice !== null) {
    const priceMatch = {};
    if (minPrice !== null) priceMatch.$gte = minPrice;
    if (maxPrice !== null) priceMatch.$lte = maxPrice;

    pipeline.push({
      $match: {
        min_price: priceMatch
      }
    });
  }

  pipeline.push({
    $project: {
      product_name: 1,
      description: 1,
      category_id: 1,
      brand_id: 1,
      category_name: "$category.name",
      brand_name: "$brand.name",
      min_price: 1,
      max_price: 1,
      total_stock: 1,
      main_image: 1,
      variant_count: 1,
      single_variant_id: 1,
      variant_options: 1,
      offer_discount_type: 1,
      offer_discount_value: 1,
      offer_start_date: 1,
      offer_expiry_date: 1,
      offer_is_active: 1,
      offer_min_final_price: 1,
      category: 1,
      createdAt: 1
    }
  });

  const sortStage = (() => {
    switch (sort) {
      case "price_asc":
        return { min_price: 1 };
      case "price_desc":
        return { min_price: -1 };
      case "name_asc":
        return { product_name: 1 };
      case "name_desc":
        return { product_name: -1 };
      default:
        return { createdAt: -1 };
    }
  })();

  const basePipeline = [...pipeline];

  const products = await Product.aggregate([
    ...basePipeline,
    { $sort: sortStage },
    { $skip: skip },
    { $limit: limit }
  ]);

  const offerAwareProducts = products.map((product) => {
    const variantOptions = (product.variant_options || []).map((variant) => {
      const pricing = getBestOfferForPrice({
        basePrice: variant.price,
        product,
        category: product.category
      });

      return {
        ...variant,
        original_price: pricing.originalPrice,
        final_price: pricing.finalPrice,
        discount_amount: pricing.discountAmount,
        has_offer: pricing.hasOffer,
        offer_source: pricing.source,
        offer_discount_type: pricing.discountType,
        offer_discount_value: pricing.discountValue
      };
    });

    const minOriginalPrice = variantOptions.length
      ? Math.min(...variantOptions.map((variant) => Number(variant.original_price || 0)))
      : 0;

    const maxOriginalPrice = variantOptions.length
      ? Math.max(...variantOptions.map((variant) => Number(variant.original_price || 0)))
      : 0;

    const minFinalPrice = variantOptions.length
      ? Math.min(...variantOptions.map((variant) => Number(variant.final_price || 0)))
      : 0;

    const maxFinalPrice = variantOptions.length
      ? Math.max(...variantOptions.map((variant) => Number(variant.final_price || 0)))
      : 0;

    const hasOffer = variantOptions.some((variant) => variant.has_offer);

    return {
      ...product,
      min_original_price: minOriginalPrice,
      max_original_price: maxOriginalPrice,
      min_final_price: minFinalPrice,
      max_final_price: maxFinalPrice,
      has_offer: hasOffer,
      variant_options: variantOptions
    };
  });

  const totalResult = await Product.aggregate([...basePipeline, { $count: "total" }]);

  const totalProducts = totalResult[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

  const categories = await Category.find({
    isDeleted: false,
    isActive: true
  })
    .sort({ name: 1 })
    .lean();

  const brands = await Brand.find({
    isDeleted: false,
    status: true
  })
    .sort({ name: 1 })
    .lean();

  return {
    products: offerAwareProducts,
    categories,
    brands,
    filters: {
      search,
      sort,
      category,
      brand,
      minPrice: query.minPrice || "",
      maxPrice: query.maxPrice || "",
      page
    },
    pagination: {
      currentPage: page,
      totalPages,
      totalProducts,
      limit
    },
    errorMessage: null
  };
};

export const getProductDetailsPageService = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isActive: true
  })
    .populate("category_id")
    .populate("brand_id")
    .lean();

  if (!product) {
    throw new Error(PRODUCT_MESSAGES.UNAVAILABLE);
  }

  if (!product.category_id || product.category_id.isDeleted || !product.category_id.isActive) {
    throw new Error(PRODUCT_MESSAGES.UNAVAILABLE);
  }

  if (product.brand_id && (product.brand_id.isDeleted || !product.brand_id.status)) {
    throw new Error(PRODUCT_MESSAGES.UNAVAILABLE);
  }

  const variants = await Product.aggregate([
    { $match: { _id: product._id } },
    {
      $lookup: {
        from: "variants",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$product_id", "$$productId"] },
              isDeleted: false,
              isActive: true
            }
          },
          { $sort: { price: 1, createdAt: 1 } }
        ],
        as: "variants"
      }
    },
    {
      $project: {
        variants: 1
      }
    }
  ]);

  const activeVariants = variants[0]?.variants || [];

  const offerAwareVariants = activeVariants.map((variant) => {
    const pricing = getBestOfferForPrice({
      basePrice: variant.price,
      product,
      category: product.category_id
    });

    return {
      ...variant,
      original_price: pricing.originalPrice,
      final_price: pricing.finalPrice,
      discount_amount: pricing.discountAmount,
      has_offer: pricing.hasOffer,
      offer_source: pricing.source,
      offer_discount_type: pricing.discountType,
      offer_discount_value: pricing.discountValue
    };
  });

  if (!activeVariants.length) {
    throw new Error(PRODUCT_MESSAGES.UNAVAILABLE);
  }

  const defaultVariant = activeVariants[0];

  const images = [
    ...(defaultVariant.main_image ? [defaultVariant.main_image] : []),
    ...(defaultVariant.gallery_images || [])
  ];

  const uniqueImages = [...new Set(images)].filter(Boolean);

  const totalStock = offerAwareVariants.reduce((sum, variant) => sum + (variant.stock_qty || 0), 0);

  const minPrice = Math.min(...offerAwareVariants.map((v) => v.final_price));
  const maxPrice = Math.max(...offerAwareVariants.map((v) => v.final_price));

  const minOriginalPrice = Math.min(...offerAwareVariants.map((v) => v.original_price));
  const maxOriginalPrice = Math.max(...offerAwareVariants.map((v) => v.original_price));

  const highlights = [];
  if (product.specifications) {
    product.specifications
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6)
      .forEach((item) => highlights.push(item));
  }

  if (!highlights.length) {
    highlights.push("Authentic product");
    highlights.push("Fast delivery support");
    highlights.push("Secure packaging");
  }

  const relatedProducts = await Product.aggregate([
    {
      $match: {
        _id: { $ne: product._id },
        category_id: product.category_id._id,
        isDeleted: false,
        isActive: true
      }
    },
    {
      $lookup: {
        from: "variants",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$product_id", "$$productId"] },
              isDeleted: false,
              isActive: true
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
        total_stock: { $sum: "$variants.stock_qty" },
        main_image: { $arrayElemAt: ["$variants.main_image", 0] }
      }
    },
    {
      $match: {
        "category.isDeleted": false,
        "category.isActive": true,
        variants: { $ne: [] },
        $or: [
          { brand: null },
          {
            "brand.isDeleted": false,
            "brand.status": true
          }
        ]
      }
    },
    {
      $project: {
        product_name: 1,
        min_price: 1,
        total_stock: 1,
        main_image: 1,
        offer_discount_type: 1,
        offer_discount_value: 1,
        offer_start_date: 1,
        offer_expiry_date: 1,
        offer_is_active: 1,
        offer_min_final_price: 1,
        category: 1
      }
    },
    { $limit: 4 }
  ]);

  const offerAwareRelatedProducts = relatedProducts.map((item) => {
    const pricing = getBestOfferForPrice({
      basePrice: item.min_price,
      product: item,
      category: item.category
    });

    return {
      ...item,
      min_original_price: pricing.originalPrice,
      min_final_price: pricing.finalPrice,
      discount_amount: pricing.discountAmount,
      has_offer: pricing.hasOffer
    };
  });

  return {
    product: {
      ...product,
      categoryId: product.category_id?._id?.toString() || "",
      brandId: product.brand_id?._id?.toString() || "",
      category_name: product.category_id?.name || "",
      brand_name: product.brand_id?.name || "",
      min_price: minPrice,
      max_price: maxPrice,
      min_original_price: minOriginalPrice,
      max_original_price: maxOriginalPrice,
      total_stock: totalStock,
      has_offer: offerAwareVariants.some((variant) => variant.has_offer)
    },
    variants: offerAwareVariants,
    images: uniqueImages,
    selectedVariant: offerAwareVariants[0],
    highlights,
    relatedProducts: offerAwareRelatedProducts,
    ratingSummary: {
      average: 4.3,
      totalReviews: 18
    },
    reviews: [
      {
        name: "Arjun",
        rating: 5,
        title: "Good quality and genuine product",
        comment: "Mixes well and delivery was quick. Packaging was also neat.",
        date: "2 days ago"
      },
      {
        name: "Nithin",
        rating: 4,
        title: "Worth buying",
        comment: "Taste was decent and product quality felt authentic.",
        date: "1 week ago"
      },
      {
        name: "Rahul",
        rating: 4,
        title: "Solid results",
        comment: "Using it consistently for training support. Stock and expiry were good.",
        date: "2 weeks ago"
      }
    ],
    coupons: [
      {
        code: "WELCOME5",
        description: "Get 5% off on your first order"
      },
      {
        code: "FIT10",
        description: "Save extra on selected wellness products"
      }
    ]
  };
};
