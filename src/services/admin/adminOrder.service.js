import Order from "../../models/order.model.js";
import Variant from "../../models/variant.model.js";
import Payment from "../../models/payment.model.js";


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

const returnedOrders = [];
for(let i of orders){
    if(i.order_status === "returned"){
        returnedOrders.push(i);
    }
}

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



function isValidAdminStatusTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    order_placed: ["pending", "confirmed", "cancelled"],
    pending: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["out_for_delivery"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: ["returned"],
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



export const updateAdminOrderStatusService = async (orderId, status) => {
  const allowedStatuses = [
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned"
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

  if (status === "cancelled") {
    await restoreStockForActiveItems(order);
  }

  if (status === "returned") {
    await restoreStockForReturnedItems(order);
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


  return order;
};

