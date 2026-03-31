import Wishlist from "../../models/wishlist.model.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Category from "../../models/category.model.js";
import Brand from "../../models/brand.model.js";

async function getValidWishlistProduct(productId) {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!product) {
    throw new Error("Product unavailable");
  }

  const category = await Category.findOne({
    _id: product.category_id,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!category) {
    throw new Error("Product unavailable");
  }

  if (product.brand_id) {
    const brand = await Brand.findOne({
      _id: product.brand_id,
      isDeleted: false,
      status: true
    }).lean();

    if (!brand) {
      throw new Error("Product unavailable");
    }
  }

  const variants = await Variant.find({
    product_id: product._id,
    isDeleted: false,
    isActive: true
  })
    .sort({ price: 1, createdAt: 1 })
    .lean();

  if (!variants.length) {
    throw new Error("Product unavailable");
  }

  return { product, variants, category };
}

export const getWishlistService = async (userId) => {
  const wishlistItems = await Wishlist.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (!wishlistItems.length) {
    return {
      items: [],
      totalItems: 0
    };
  }

  const items = [];

  for (const entry of wishlistItems) {
    const product = await Product.findById(entry.product_id).lean();

    if (!product || product.isDeleted || !product.isActive) {
      continue;
    }

    const category = await Category.findById(product.category_id).lean();
    if (!category || category.isDeleted || !category.isActive) {
      continue;
    }

    let brand = null;
    if (product.brand_id) {
      brand = await Brand.findById(product.brand_id).lean();
      if (!brand || brand.isDeleted || !brand.status) {
        continue;
      }
    }

    const variants = await Variant.find({
      product_id: product._id,
      isDeleted: false,
      isActive: true
    })
      .sort({ price: 1, createdAt: 1 })
      .lean();

    if (!variants.length) {
      continue;
    }

    const minPrice = Math.min(...variants.map((variant) => variant.price));
    const maxPrice = Math.max(...variants.map((variant) => variant.price));
    const totalStock = variants.reduce((sum, variant) => sum + variant.stock_qty, 0);
    const firstVariant = variants[0];

    items.push({
        _id: entry._id,
        product_id: product._id,
        product_name: product.product_name,
        category_name: category.name,
        brand_name: brand?.name || "",
        main_image: firstVariant?.main_image || "/images/no-image.png",
        min_price: minPrice,
        max_price: maxPrice,
        total_stock: totalStock,
        variant_count: variants.length,
        single_variant_id: variants.length === 1 ? variants[0]._id : null,
        variant_options: variants.map((variant) => ({
            _id: variant._id,
            price: variant.price,
            stock_qty: variant.stock_qty,
            main_image: variant.main_image,
            attributes: variant.attributes || []
        }))
    });

  }

  return {
    items,
    totalItems: items.length
  };
};

export const addToWishlistService = async (userId, productId) => {
  await getValidWishlistProduct(productId);

  const existing = await Wishlist.findOne({
    user_id: userId,
    product_id: productId
  });

  if (existing) {
    return existing;
  }

  const wishlistItem = await Wishlist.create({
    user_id: userId,
    product_id: productId
  });

  return wishlistItem;
};

export const removeFromWishlistService = async (userId, productId) => {
  const removed = await Wishlist.findOneAndDelete({
    user_id: userId,
    product_id: productId
  });

  if (!removed) {
    throw new Error("Wishlist item not found");
  }

  return removed;
};

export const clearWishlistService = async (userId) => {
  await Wishlist.deleteMany({ user_id: userId });

  return true;
};
