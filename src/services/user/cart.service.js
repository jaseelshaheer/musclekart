import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Category from "../../models/category.model.js";
import Brand from "../../models/brand.model.js";
import Wishlist from "../../models/wishlist.model.js";
import { CART_MESSAGES } from "../../constants/messages.js";

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

async function getValidCartVariant(productId, variantId) {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!product) {
    throw new Error(CART_MESSAGES.PRODUCT_UNAVAILABLE);
  }

  const category = await Category.findOne({
    _id: product.category_id,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!category) {
    throw new Error(CART_MESSAGES.PRODUCT_UNAVAILABLE);
  }

  if (product.brand_id) {
    const brand = await Brand.findOne({
      _id: product.brand_id,
      isDeleted: false,
      status: true
    }).lean();

    if (!brand) {
      throw new Error(CART_MESSAGES.PRODUCT_UNAVAILABLE);
    }
  }

  const variant = await Variant.findOne({
    _id: variantId,
    product_id: productId,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!variant) {
    throw new Error(CART_MESSAGES.VARIANT_UNAVAILABLE);
  }

  return { product, category, variant };
}

function getCartStockLimitMessage(stockQty) {
  return `Product is already in cart and only ${stockQty} unit${stockQty > 1 ? "s" : ""} available`;
}

export const getCartService = async (userId) => {
  const cart = await Cart.findOne({ user_id: userId }).lean();

  if (!cart || !cart.cart_items.length) {
    return {
      items: [],
      subtotal: 0,
      totalItems: 0,
      hasUnavailableItems: false
    };
  }

  const items = [];

  for (const item of cart.cart_items) {
    const product = await Product.findById(item.product_id).lean();

    const variant = await Variant.findById(item.variant_id).lean();

    let isAvailable = true;

    if (!product || product.isDeleted || !product.isActive) {
      isAvailable = false;
    }

    if (!variant || variant.isDeleted || !variant.isActive) {
      isAvailable = false;
    }

    if (isAvailable && product.category_id) {
      const category = await Category.findById(product.category_id).lean();

      if (!category || category.isDeleted || !category.isActive) {
        isAvailable = false;
      }
    }

    if (isAvailable && product.brand_id) {
      const brand = await Brand.findById(product.brand_id).lean();

      if (!brand || brand.isDeleted || !brand.status) {
        isAvailable = false;
      }
    }

    let originalPrice = item.unitPrice;
    let finalPrice = item.unitPrice;
    let discountAmount = 0;
    let offerSource = null;
    let offerDiscountType = null;
    let offerDiscountValue = 0;

    if (isAvailable && product?.category_id) {
      const category = await Category.findById(product.category_id).lean();

      if (category && !category.isDeleted && category.isActive) {
        const pricing = getBestOfferForPrice({
          basePrice: variant.price,
          product,
          category
        });

        originalPrice = pricing.originalPrice;
        finalPrice = pricing.finalPrice;
        discountAmount = pricing.discountAmount;
        offerSource = pricing.source;
        offerDiscountType = pricing.discountType;
        offerDiscountValue = pricing.discountValue;
      }
    }

    items.push({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unitPrice: finalPrice,
      originalPrice,
      discountAmount,
      lineDiscountAmount: discountAmount * item.quantity,
      hasOffer: discountAmount > 0,
      offerSource,
      offerDiscountType,
      offerDiscountValue,
      itemTotal: finalPrice * item.quantity,
      addedAt: item.addedAt,
      product_name: product?.product_name || "Unavailable product",
      main_image: variant?.main_image || "/images/no-image.png",
      attributes: variant?.attributes || [],
      stock_qty: variant?.stock_qty || 0,
      isAvailable
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasUnavailableItems = items.some((item) => !item.isAvailable || item.stock_qty <= 0);

  return {
    items,
    subtotal,
    totalItems,
    hasUnavailableItems
  };
};

export const addToCartService = async (userId, productId, variantId, quantity = 1) => {
  const qty = Number(quantity);

  if (!qty || qty < 1) {
    throw new Error(CART_MESSAGES.INVALID_QUANTITY);
  }

  const { product, category, variant } = await getValidCartVariant(productId, variantId);
  const pricing = getBestOfferForPrice({
    basePrice: variant.price,
    product,
    category
  });

  if (variant.stock_qty <= 0) {
    throw new Error(CART_MESSAGES.OUT_OF_STOCK);
  }

  let cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    cart = await Cart.create({
      user_id: userId,
      cart_items: []
    });
  }

  const existingItem = cart.cart_items.find(
    (item) => String(item.variant_id) === String(variantId)
  );

  if (existingItem) {
    const nextQty = existingItem.quantity + qty;

    if (nextQty > variant.stock_qty) {
      throw new Error(getCartStockLimitMessage(variant.stock_qty));
    }

    existingItem.quantity = nextQty;
    existingItem.unitPrice = pricing.finalPrice;
  } else {
    if (qty > variant.stock_qty) {
      throw new Error(CART_MESSAGES.OUT_OF_STOCK);
    }

    cart.cart_items.push({
      product_id: productId,
      variant_id: variantId,
      quantity: qty,
      unitPrice: pricing.finalPrice
    });
  }

  await cart.save();

  await Wishlist.findOneAndDelete({
    user_id: userId,
    product_id: productId
  });

  return cart;
};

export const updateCartItemQuantityService = async (userId, variantId, action) => {
  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    throw new Error(CART_MESSAGES.ITEM_NOT_FOUND);
  }

  const item = cart.cart_items.find((entry) => String(entry.variant_id) === String(variantId));

  if (!item) {
    throw new Error(CART_MESSAGES.ITEM_NOT_FOUND);
  }

  const variant = await Variant.findOne({
    _id: variantId,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!variant) {
    throw new Error(CART_MESSAGES.VARIANT_UNAVAILABLE);
  }

  const product = await Product.findOne({
    _id: item.product_id,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!product) {
    throw new Error(CART_MESSAGES.PRODUCT_UNAVAILABLE);
  }

  const category = await Category.findOne({
    _id: product.category_id,
    isDeleted: false,
    isActive: true
  }).lean();

  if (!category) {
    throw new Error(CART_MESSAGES.PRODUCT_UNAVAILABLE);
  }

  const pricing = getBestOfferForPrice({
    basePrice: variant.price,
    product,
    category
  });

  if (action === "increment") {
    if (item.quantity + 1 > variant.stock_qty) {
      throw new Error(getCartStockLimitMessage(variant.stock_qty));
    }

    item.quantity += 1;
  } else if (action === "decrement") {
    if (item.quantity <= 1) {
      throw new Error(CART_MESSAGES.INVALID_QUANTITY);
    }

    item.quantity -= 1;
  } else {
    throw new Error(CART_MESSAGES.INVALID_QUANTITY);
  }

  item.unitPrice = pricing.finalPrice;

  await cart.save();
  return cart;
};

export const removeCartItemService = async (userId, variantId) => {
  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    throw new Error(CART_MESSAGES.ITEM_NOT_FOUND);
  }

  const initialLength = cart.cart_items.length;

  cart.cart_items = cart.cart_items.filter((item) => String(item.variant_id) !== String(variantId));

  if (cart.cart_items.length === initialLength) {
    throw new Error(CART_MESSAGES.ITEM_NOT_FOUND);
  }

  await cart.save();
  return cart;
};

export const clearCartService = async (userId) => {
  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    return true;
  }

  cart.cart_items = [];
  await cart.save();

  return true;
};
