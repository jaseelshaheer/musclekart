import Order from "../../models/order.model.js";
import Variant from "../../models/variant.model.js";
import Payment from "../../models/payment.model.js";
import Coupon from "../../models/coupon.model.js";
import { creditWalletService } from "./wallet.service.js";


export const getUserOrdersService = async (userId, query = {}) => {
  const {
    search = "",
    page = 1,
    limit = 3
  } = query;

  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 3;
  const skip = (pageNumber - 1) * limitNumber;

  const match = {
    user_id: userId
  };

  if (search?.trim()) {
    match.order_id = { $regex: search.trim(), $options: "i" };
  }

  const totalOrders = await Order.countDocuments(match);

  const orders = await Order.find(match)
    .sort({ order_date: -1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  return {
    orders,
    totalOrders,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalOrders / limitNumber)
  };
};

export const getUserOrderByOrderIdService = async (userId, orderId) => {
  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  }).lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};



async function syncOrderPaymentState(order, nextOrderPaymentStatus, nextPaymentStatus) {
  order.payment_status = nextOrderPaymentStatus;

  const payment = await Payment.findOne({ order_id: order._id });

  if (payment) {
    payment.status = nextPaymentStatus;

    if (nextPaymentStatus === "completed") {
      payment.paid_at = new Date();
    }

    await payment.save();
  }
}


async function releaseCouponUsage(order) {
  if (!order.coupon_id) return;

  const coupon = await Coupon.findById(order.coupon_id);
  if (!coupon) return;

  coupon.used_count = Math.max((coupon.used_count || 0) - 1, 0);
  await coupon.save();
}


function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getDiscountAdjustedRefund(order, baseAmount) {
  const subtotal = Number(order.subtotal || 0);
  const grandTotal = Number(order.grand_total || 0);

  if (subtotal <= 0) {
    return roundMoney(baseAmount);
  }

  const proportionalPaidAmount = (Number(baseAmount || 0) / subtotal) * grandTotal;
  return roundMoney(proportionalPaidAmount);
}

function getRefundableAmountForActiveItems(order) {
  const activeItemsTotal = order.items.reduce((sum, item) => {
    if (item.item_status === "active") {
      return sum + Number(item.total || 0);
    }
    return sum;
  }, 0);

  return getDiscountAdjustedRefund(order, activeItemsTotal);
}




export const cancelOrderService = async (userId, orderId, reason = "") => {
  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!isCancellableOrderStatus(order.order_status)) {
    throw new Error("This order can no longer be cancelled");
  }

  const refundableAmount = getRefundableAmountForActiveItems(order);

  for (const item of order.items) {
    if (item.item_status === "active") {
      item.item_status = "cancelled";
      item.cancel_reason = reason?.trim() || "";

      const variant = await Variant.findById(item.variant_id);
      if (variant) {
        variant.stock_qty += item.quantity;
        await variant.save();
      }
    }
  }

  order.order_status = "cancelled";
  order.status_history.push({
    status: "cancelled",
    changed_at: new Date(),
    note: reason?.trim() || "Order cancelled by user",
  });

  if (order.payment_status === "paid") {
    await syncOrderPaymentState(order, "refunded", "refunded");
  } else {
    await syncOrderPaymentState(order, "cancelled", "cancelled");
  }

  await order.save();
  await releaseCouponUsage(order);

  if (refundableAmount > 0) {
    await creditWalletService({
      userId,
      amount: refundableAmount,
      description: `Refund for cancelled order ${order.order_id}`,
      source: "order_cancel",
      orderId: order._id,
    });
  }

  return order;
};


export const cancelOrderItemService = async (
  userId,
  orderId,
  itemIndex,
  reason = ""
) => {
  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!isCancellableOrderStatus(order.order_status)) {
    throw new Error("This order can no longer be modified");
  }

  const item = order.items[itemIndex];

  if (!item) {
    throw new Error("Order item not found");
  }

  if (!isCancellableItemStatus(item.item_status)) {
    throw new Error("This item cannot be cancelled");
  }

  const refundableAmount = getDiscountAdjustedRefund(order, Number(item.total || 0));

  item.item_status = "cancelled";
  item.cancel_reason = reason?.trim() || "";

  const variant = await Variant.findById(item.variant_id);
  if (variant) {
    variant.stock_qty += item.quantity;
    await variant.save();
  }

  const hasActiveItems = order.items.some((entry) => entry.item_status === "active");

  if (!hasActiveItems) {
    order.order_status = "cancelled";
    order.status_history.push({
      status: "cancelled",
      changed_at: new Date(),
      note: "All order items were cancelled",
    });

    if (order.payment_status === "paid") {
      await syncOrderPaymentState(order, "refunded", "refunded");
    } else {
      await syncOrderPaymentState(order, "cancelled", "cancelled");
    }
  }

  await order.save();

  if (!hasActiveItems) {
    await releaseCouponUsage(order);
  }


  if (refundableAmount > 0) {
    await creditWalletService({
      userId,
      amount: refundableAmount,
      description: `Refund for cancelled item in order ${order.order_id}`,
      source: "order_cancel",
      orderId: order._id,
    });
  }

  return order;
};


export const returnOrderService = async (userId, orderId, reason) => {
  const trimmedReason = reason?.trim();

  if (!trimmedReason) {
    throw new Error("Return reason is required");
  }

  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!isReturnableOrderStatus(order.order_status)) {
    throw new Error("Only delivered orders can be returned");
  }

  for (const item of order.items) {
    if (item.item_status === "active") {
      item.item_status = "return_requested";
      item.return_reason = trimmedReason;
      item.return_reject_reason = "";
    }
  }

  order.order_status = "return_requested";
  order.status_history.push({
    status: "return_requested",
    changed_at: new Date(),
    note: trimmedReason,
  });

  order.return_reject_reason = "";

  await order.save();

  return order;
};



export const returnOrderItemService = async (
  userId,
  orderId,
  itemIndex,
  reason
) => {
  const trimmedReason = reason?.trim();

  if (!trimmedReason) {
    throw new Error("Return reason is required");
  }

  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!isReturnableOrderStatus(order.order_status)) {
    throw new Error("Only delivered orders can be returned");
  }

  const item = order.items[itemIndex];

  if (!item) {
    throw new Error("Order item not found");
  }

  if (!isReturnableItemStatus(item.item_status)) {
    throw new Error("This item cannot be returned");
  }

  item.item_status = "return_requested";
  item.return_reason = trimmedReason;

  item.return_reject_reason = "";

  const hasActiveItems = order.items.some((entry) => entry.item_status === "active");

  if (!hasActiveItems) {
    order.order_status = "return_requested";
    item.return_reject_reason = "";
    order.status_history.push({
      status: "return_requested",
      changed_at: new Date(),
      note: "All order items were marked for return request",
    });
  }


  await order.save();


  return order;
};


export const getUserOrderInvoiceService = async (userId, orderId) => {
  const order = await Order.findOne({
    user_id: userId,
    order_id: orderId
  }).lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};





function isCancellableOrderStatus(status) {
  return ["order_placed", "pending", "confirmed", "packed"].includes(status);
}

function isCancellableItemStatus(status) {
  return status === "active";
}

function isReturnableOrderStatus(status) {
  return status === "delivered";
}

function isReturnableItemStatus(status) {
  return status === "active";
}

