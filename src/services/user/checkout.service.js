import Cart from "../../models/cart.model.js";
import Address from "../../models/address.model.js";
import Variant from "../../models/variant.model.js";
import Order from "../../models/order.model.js";
import Payment from "../../models/payment.model.js";
import { getCartService } from "./cart.service.js";


function generateOrderId() {
  const timestamp = Date.now();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `MKORD-${timestamp}-${randomPart}`;
}



export const getCheckoutPageService = async (userId) => {
  const cartData = await getCartService(userId);

  const addresses = await Address.find({ user: userId })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();

  const defaultAddress =
    addresses.find((address) => address.isDefault) || addresses[0] || null;

  const shipping = 0;
  const tax = 0;
  const discount = 0;
  const finalTotal = cartData.subtotal + shipping + tax - discount;

  const canCheckout =
    cartData.items.length > 0 &&
    !cartData.hasUnavailableItems &&
    Boolean(defaultAddress);

  return {
    items: cartData.items,
    subtotal: cartData.subtotal,
    totalItems: cartData.totalItems,
    hasUnavailableItems: cartData.hasUnavailableItems,
    addresses,
    defaultAddress,
    shipping,
    tax,
    discount,
    finalTotal,
    canCheckout
  };
};


export const placeOrderService = async (userId, payload) => {
  const { addressId, paymentMethod = "cod" } = payload;

  if (!addressId) {
    throw new Error("Please select a delivery address");
  }

  if (paymentMethod !== "cod") {
    throw new Error("Only Cash on Delivery is available right now");
  }

  const checkoutData = await getCheckoutPageService(userId);

  if (!checkoutData.items.length) {
    throw new Error("Your cart is empty");
  }

  if (checkoutData.hasUnavailableItems) {
    throw new Error("Remove unavailable or out-of-stock items before checkout");
  }

  const address = await Address.findOne({
    _id: addressId,
    user: userId
  }).lean();

  if (!address) {
    throw new Error("Address not found");
  }

  for (const item of checkoutData.items) {
    const variant = await Variant.findOne({
      _id: item.variant_id,
      isDeleted: false,
      isActive: true
    });

    if (!variant) {
      throw new Error("One or more items are unavailable");
    }

    if (variant.stock_qty < item.quantity) {
      throw new Error(`Insufficient stock for ${item.product_name}`);
    }
  }

  const orderId = generateOrderId();

  const order = await Order.create({
    order_id: orderId,
    user_id: userId,
    order_date: new Date(),
    order_status: "order_placed",
    payment_method: "cod",
    payment_status: "pending",
    subtotal: checkoutData.subtotal,
    delivery_charge: checkoutData.shipping,
    discount: checkoutData.discount,
    grand_total: checkoutData.finalTotal,
    address_id: address._id,
    address_snapshot: {
      name: address.name,
      phone: address.phone,
      house: address.house,
      country: address.country,
      district: address.district,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
      address_type: address.addressType
    },
    items: checkoutData.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      main_image: item.main_image || "",
      quantity: item.quantity,
      price: item.unitPrice,
      total: item.itemTotal,
      item_status: "active",
      cancel_reason: "",
      return_reason: "",
      attributes: item.attributes || []
    })),
    status_history: [
      {
        status: "order_placed",
        changed_at: new Date(),
        note: "Order has been placed successfully"
      }
    ]
  });

  await Payment.create({
    order_id: order._id,
    method: "cod",
    status: "pending",
    transaction_id: "",
    paid_at: null
  });

  for (const item of checkoutData.items) {
    const variant = await Variant.findById(item.variant_id);
    variant.stock_qty -= item.quantity;
    await variant.save();
  }

  await Cart.findOneAndUpdate(
    { user_id: userId },
    { $set: { cart_items: [] } }
  );

  return {
    orderId: order.order_id,
    orderDbId: order._id
  };
};

