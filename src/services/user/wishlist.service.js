import Wishlist from "../../models/wishlist.model.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Category from "../../models/category.model.js";
import Brand from "../../models/brand.model.js";


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
        applyOfferToPrice(
          basePrice,
          product.offer_discount_type,
          product.offer_discount_value
        ),
        minFinalPrice
      )
    : null;

  const categoryOfferResult = categoryHasOffer
    ? applyProductPriceFloor(
        basePrice,
        applyOfferToPrice(
          basePrice,
          category.offer_discount_type,
          category.offer_discount_value
        ),
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

    const offerAwareVariants = variants.map((variant) => {
      const pricing = getBestOfferForPrice({
        basePrice: variant.price,
        product,
        category,
      });

      return {
        ...variant,
        original_price: pricing.originalPrice,
        final_price: pricing.finalPrice,
        discount_amount: pricing.discountAmount,
        has_offer: pricing.hasOffer,
        offer_source: pricing.source,
        offer_discount_type: pricing.discountType,
        offer_discount_value: pricing.discountValue,
      };
    });

    const minOriginalPrice = Math.min(
      ...offerAwareVariants.map((variant) =>
        Number(variant.original_price || 0),
      ),
    );

    const maxOriginalPrice = Math.max(
      ...offerAwareVariants.map((variant) =>
        Number(variant.original_price || 0),
      ),
    );

    const minFinalPrice = Math.min(
      ...offerAwareVariants.map((variant) => Number(variant.final_price || 0)),
    );

    const maxFinalPrice = Math.max(
      ...offerAwareVariants.map((variant) => Number(variant.final_price || 0)),
    );

    const totalStock = offerAwareVariants.reduce(
      (sum, variant) => sum + variant.stock_qty,
      0,
    );

    const firstVariant = offerAwareVariants[0];
    const hasOffer = offerAwareVariants.some((variant) => variant.has_offer);

    items.push({
        _id: entry._id,
        product_id: product._id,
        product_name: product.product_name,
        category_name: category.name,
        brand_name: brand?.name || "",
        main_image: firstVariant?.main_image || "/images/no-image.png",
        min_original_price: minOriginalPrice,
        max_original_price: maxOriginalPrice,
        min_final_price: minFinalPrice,
        max_final_price: maxFinalPrice,
        has_offer: hasOffer,
        total_stock: totalStock,
        variant_count: offerAwareVariants.length,
        single_variant_id: offerAwareVariants.length === 1 ? offerAwareVariants[0]._id : null,
        variant_options: offerAwareVariants.map((variant) => ({
          _id: variant._id,
          price: variant.price,
          original_price: variant.original_price,
          final_price: variant.final_price,
          discount_amount: variant.discount_amount,
          has_offer: variant.has_offer,
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
