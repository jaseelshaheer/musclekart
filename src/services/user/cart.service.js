import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Category from "../../models/category.model.js";
import Brand from "../../models/brand.model.js";
import Wishlist from "../../models/wishlist.model.js";
import { CART_MESSAGES } from "../../constants/messages.js";


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

  return { product, variant };
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



    items.push({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      itemTotal: item.unitPrice * item.quantity,
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
  const hasUnavailableItems = items.some(
    (item) => !item.isAvailable || item.stock_qty <= 0
  );

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

  const { variant } = await getValidCartVariant(productId, variantId);

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
      throw new Error(CART_MESSAGES.OUT_OF_STOCK);
    }

    existingItem.quantity = nextQty;
    existingItem.unitPrice = variant.price;
  } else {

    if (qty > variant.stock_qty) {
      throw new Error(CART_MESSAGES.OUT_OF_STOCK);
    }

    cart.cart_items.push({
      product_id: productId,
      variant_id: variantId,
      quantity: qty,
      unitPrice: variant.price
    });
  }

  await cart.save();
  
  await Wishlist.findOneAndDelete({
    user_id: userId,
    product_id: productId,
  });


  return cart;
};


export const updateCartItemQuantityService = async (userId, variantId, action) => {
  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    throw new Error(CART_MESSAGES.ITEM_NOT_FOUND);
  }

  const item = cart.cart_items.find(
    (entry) => String(entry.variant_id) === String(variantId)
  );

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

  if (action === "increment") {

    if (item.quantity + 1 > variant.stock_qty) {
      throw new Error(CART_MESSAGES.OUT_OF_STOCK);
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

  item.unitPrice = variant.price;

  await cart.save();
  return cart;
};


export const removeCartItemService = async (userId, variantId) => {
  const cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    throw new Error(CART_MESSAGES.ITEM_NOT_FOUND);
  }

  const initialLength = cart.cart_items.length;

  cart.cart_items = cart.cart_items.filter(
    (item) => String(item.variant_id) !== String(variantId)
  );

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

