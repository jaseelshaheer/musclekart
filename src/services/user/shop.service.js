import mongoose from "mongoose";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import Brand from "../../models/brand.model.js";
import { PRODUCT_MESSAGES } from "../../constants/messages.js";

export const getProductsPageService = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const search = (query.search || "").trim();
  const sort = (query.sort || "").trim();
  const category = (query.category || "").trim();
  const brand = (query.brand || "").trim();
  const minPrice = query.minPrice !== undefined && query.minPrice !== "" ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined && query.maxPrice !== "" ? Number(query.maxPrice) : null;

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

  const totalResult = await Product.aggregate([
    ...basePipeline,
    { $count: "total" }
  ]);

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
    products,
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

  if (!activeVariants.length) {
    throw new Error(PRODUCT_MESSAGES.UNAVAILABLE);
  }

  const defaultVariant = activeVariants[0];

  const images = [
    ...(defaultVariant.main_image ? [defaultVariant.main_image] : []),
    ...(defaultVariant.gallery_images || [])
  ];

  const uniqueImages = [...new Set(images)].filter(Boolean);

  const totalStock = activeVariants.reduce(
    (sum, variant) => sum + (variant.stock_qty || 0),
    0
  );

  const minPrice = Math.min(...activeVariants.map(v => v.price));
  const maxPrice = Math.max(...activeVariants.map(v => v.price));

  const highlights = [];
  if (product.specifications) {
    product.specifications
      .split(/\n|,/)
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 6)
      .forEach(item => highlights.push(item));
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
        main_image: 1
      }
    },
    { $limit: 4 }
  ]);

  const originalPrice = Math.round(minPrice * 1.12);
  const discountPercent = Math.max(
    0,
    Math.round(((originalPrice - minPrice) / originalPrice) * 100)
  );

  return {
    product: {
      ...product,
      categoryId: product.category_id?._id?.toString() || "",
      brandId: product.brand_id?._id?.toString() || "",
      category_name: product.category_id?.name || "",
      brand_name: product.brand_id?.name || "",
      min_price: minPrice,
      max_price: maxPrice,
      total_stock: totalStock,
      original_price: originalPrice,
      discount_percent: discountPercent
    },
    variants: activeVariants,
    images: uniqueImages,
    selectedVariant: defaultVariant,
    highlights,
    relatedProducts,
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

