import Order from "../../models/order.model.js";
import Variant from "../../models/variant.model.js";
import Payment from "../../models/payment.model.js";
import { creditWalletService } from "../user/wallet.service.js";
import Coupon from "../../models/coupon.model.js";


export const getAdminOrdersService = async ({
  page = 1,
  limit = 10,
  search = "",
  status = ""
}) => {
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const match = {};

  if (search?.trim()) {
    match.order_id = { $regex: search.trim(), $options: "i" };
  }

  if (status?.trim()) {
    match.order_status = status.trim();
  }

  const totalOrders = await Order.countDocuments(match);

  const orders = await Order.find(match)
    .sort({ order_date: -1 })
    .skip(skip)
    .limit(limitNumber)
    .populate("user_id", "firstName lastName email phone")
    .lean();
    

  return {
    orders,
    totalOrders,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalOrders / limitNumber)
  };
};

export const getAdminOrderDetailService = async (orderId) => {
  const order = await Order.findOne({ order_id: orderId })
    .populate("user_id", "firstName lastName email phone")
    .lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};


async function restoreStockForActiveItems(order) {
  for (const item of order.items) {
    if (item.item_status === "active") {
      const variant = await Variant.findById(item.variant_id);

      if (variant) {
        variant.stock_qty += item.quantity;
        await variant.save();
      }

      item.item_status = "cancelled";
      item.cancel_reason = item.cancel_reason || "Cancelled by admin";
    }
  }
}

async function restoreStockForReturnedItems(order) {
  for (const item of order.items) {
    if (item.item_status === "active") {
      const variant = await Variant.findById(item.variant_id);

      if (variant) {
        variant.stock_qty += item.quantity;
        await variant.save();
      }

      item.item_status = "returned";
      item.return_reason = item.return_reason || "Returned by admin";
    }
  }
}


async function finalizeRequestedReturnItems(order) {
  for (const item of order.items) {
    if (item.item_status === "return_requested") {
      const variant = await Variant.findById(item.variant_id);

      if (variant) {
        variant.stock_qty += item.quantity;
        await variant.save();
      }

      item.item_status = "returned";
    }
  }
}


function rejectRequestedReturnItems(order) {
  for (const item of order.items) {
    if (item.item_status === "return_requested") {
      item.item_status = "active";
    }
  }
}


function isValidAdminStatusTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    order_placed: ["pending", "confirmed", "cancelled"],
    pending: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["out_for_delivery"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    return_requested: [],
    return_rejected: [],
    cancelled: [],
    returned: []
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) || false;
}



async function syncAdminOrderPaymentState(order, nextOrderPaymentStatus, nextPaymentStatus) {
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


function getRefundableAmountForReturn(order) {
  const requestedItemsTotal = order.items.reduce((sum, item) => {
    if (item.item_status === "return_requested") {
      return sum + Number(item.total || 0);
    }
    return sum;
  }, 0);

  return getDiscountAdjustedRefund(order, requestedItemsTotal);
}



export const updateAdminOrderStatusService = async (orderId, status) => {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled"
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  const order = await Order.findOne({ order_id: orderId });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!isValidAdminStatusTransition(order.order_status, status)) {
    throw new Error("Invalid order status transition");
  }

  const refundableAmount =
    status === "cancelled"
        ? getRefundableAmountForActiveItems(order)
        : status === "returned"
        ? getRefundableAmountForReturn(order)
        : 0;



  if (status === "cancelled") {
    await restoreStockForActiveItems(order);
  }

  if (status === "returned") {
    await finalizeRequestedReturnItems(order);
  }

  if (order.order_status === "return_requested" && status === "delivered") {
    rejectRequestedReturnItems(order);
  }

  order.order_status = status;

  if (status === "delivered") {
    await syncAdminOrderPaymentState(order, "paid", "completed");
  }

  if (status === "cancelled") {
    if (order.payment_status === "paid") {
      await syncAdminOrderPaymentState(order, "refunded", "refunded");
    } else {
      await syncAdminOrderPaymentState(order, "cancelled", "cancelled");
    }
  }

  if (status === "returned") {
    await syncAdminOrderPaymentState(order, "refunded", "refunded");
  }

  order.status_history.push({
    status,
    changed_at: new Date(),
    note: `Order status changed to ${status.replaceAll("_", " ")} by admin`,
  });

  await order.save();

  if (status === "cancelled") {
    await releaseCouponUsage(order);
  }

  if (status === "cancelled" && refundableAmount > 0) {
    await creditWalletService({
      userId: order.user_id,
      amount: refundableAmount,
      description: `Refund for cancelled order ${order.order_id}`,
      source: "order_cancel",
      orderId: order._id,
    });
  }

  if (status === "returned" && refundableAmount > 0) {
    await creditWalletService({
        userId: order.user_id,
        amount: refundableAmount,
        description: `Refund for returned order ${order.order_id}`,
        source: "order_return",
        orderId: order._id
    });
  }


  return order;
};


export const approveReturnRequestService = async (orderId) => {
  const order = await Order.findOne({ order_id: orderId });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.order_status !== "return_requested") {
    throw new Error("No pending return request found");
  }

  const refundableAmount = getRefundableAmountForReturn(order);

  for (const item of order.items) {
    if (item.item_status === "return_requested") {
      const variant = await Variant.findById(item.variant_id);

      if (variant) {
        variant.stock_qty += item.quantity;
        await variant.save();
      }

      item.item_status = "returned";
      item.return_reject_reason = "";
    }
  }

  order.order_status = "returned";
  order.return_reject_reason = "";

  await syncAdminOrderPaymentState(order, "refunded", "refunded");

  order.status_history.push({
    status: "returned",
    changed_at: new Date(),
    note: "Return request approved by admin"
  });

  await order.save();

  if (refundableAmount > 0) {
    await creditWalletService({
      userId: order.user_id,
      amount: refundableAmount,
      description: `Refund for returned order ${order.order_id}`,
      source: "order_return",
      orderId: order._id
    });
  }

  return order;
};

export const rejectReturnRequestService = async (orderId, reason) => {
  const trimmedReason = reason?.trim();

  if (!trimmedReason) {
    throw new Error("Return rejection reason is required");
  }

  const order = await Order.findOne({ order_id: orderId });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.order_status !== "return_requested") {
    throw new Error("No pending return request found");
  }

  for (const item of order.items) {
    if (item.item_status === "return_requested") {
      item.item_status = "return_rejected";
      item.return_reject_reason = trimmedReason;
    }
  }

  order.order_status = "return_rejected";
  order.return_reject_reason = trimmedReason;

  order.status_history.push({
    status: "return_rejected",
    changed_at: new Date(),
    note: trimmedReason
  });

  await order.save();

  return order;
};


