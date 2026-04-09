import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import Brand from "../../models/brand.model.js";

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function getDateRange({ period = "monthly", from, to }) {
  const now = new Date();
  let start;
  let end;


  if (period === "daily") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now);
  } else if (period === "weekly") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start = new Date(now);
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
  } else if (period === "yearly") {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now);
  } else if (period === "custom") {
    start = from ? new Date(from) : null;
    end = to ? new Date(to) : new Date(now);
    if (end) end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now);
  }


  if (start && Number.isNaN(start.getTime())) {
    throw new Error("Invalid from date");
  }

  if (end && Number.isNaN(end.getTime())) {
    throw new Error("Invalid to date");
  }

  if (start && end && start > end) {
    // throw new Error("From date cannot be after To date");
    throw new Error("Start date should be less than end date");
  }

  return { start, end };
}

function getReportMatch({ period, from, to }) {
  const { start, end } = getDateRange({ period, from, to });

  const match = {
    order_status: { $nin: ["cancelled", "returned"] }
  };

  if (start || end) {
    match.order_date = {};
    if (start) match.order_date.$gte = start;
    if (end) match.order_date.$lte = end;
  }

  return { match, start, end };
}

function getItemOfferDiscount(order) {
  return round2(
    (order.items || []).reduce((sum, item) => {
      return sum + Number(item.discount_amount || 0) * Number(item.quantity || 0);
    }, 0)
  );
}

// function buildTrendMap(trendRows) {
//   const map = new Map();
//   trendRows.forEach((row) => {
//     map.set(row._id, {
//       label: row._id,
//       salesCount: Number(row.salesCount || 0),
//       orderAmount: round2(row.orderAmount || 0)
//     });
//   });
//   return map;
// }

function getMonthLabels() {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

export async function getSalesReportService({ period = "monthly", from, to }) {
  const { match, start, end } = getReportMatch({ period, from, to });

  const [summaryRow] = await Order.aggregate([
    { $match: match },
    {
      $addFields: {
        order_offer_discount: {
          $sum: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                $multiply: [
                  { $ifNull: ["$$item.discount_amount", 0] },
                  { $ifNull: ["$$item.quantity", 0] }
                ]
              }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        salesCount: { $sum: 1 },
        orderAmount: { $sum: { $ifNull: ["$grand_total", 0] } },
        couponDiscountAmount: { $sum: { $ifNull: ["$discount", 0] } },
        offerDiscountAmount: { $sum: { $ifNull: ["$order_offer_discount", 0] } }
      }
    }
  ]);

  const trendRows = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$order_date"
          }
        },
        salesCount: { $sum: 1 },
        orderAmount: { $sum: { $ifNull: ["$grand_total", 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const orders = await Order.find(match)
    .select(
      "order_id order_date order_status payment_method payment_status subtotal discount grand_total items"
    )
    .sort({ order_date: -1 })
    .limit(300)
    .lean();

  const rows = orders.map((order) => {
    const offerDiscount = getItemOfferDiscount(order);
    const couponDiscount = round2(order.discount || 0);

    return {
      orderId: order.order_id,
      orderDate: order.order_date,
      orderStatus: order.order_status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      subtotal: round2(order.subtotal || 0),
      couponDiscount,
      offerDiscount,
      grandTotal: round2(order.grand_total || 0),
      totalDiscount: round2(couponDiscount + offerDiscount)
    };
  });

  return {
    filter: {
      period,
      from: start,
      to: end
    },
    summary: {
      salesCount: Number(summaryRow?.salesCount || 0),
      orderAmount: round2(summaryRow?.orderAmount || 0),
      couponDiscountAmount: round2(summaryRow?.couponDiscountAmount || 0),
      offerDiscountAmount: round2(summaryRow?.offerDiscountAmount || 0),
      totalDiscountAmount: round2(
        Number(summaryRow?.couponDiscountAmount || 0) + Number(summaryRow?.offerDiscountAmount || 0)
      )
    },
    trend: trendRows.map((row) => ({
      label: row._id,
      salesCount: Number(row.salesCount || 0),
      orderAmount: round2(row.orderAmount || 0)
    })),
    rows
  };
}

export async function getDashboardAnalyticsService({ view = "monthly", year }) {
  const now = new Date();
  const selectedYear = Number(year) || now.getFullYear();

  const match = {
    order_status: { $nin: ["cancelled", "returned"] }
  };

  let chart;

  if (view === "yearly") {
    const startYear = now.getFullYear() - 4;
    const startDate = new Date(startYear, 0, 1);
    const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const rows = await Order.aggregate([
      {
        $match: {
          ...match,
          order_date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $year: "$order_date" },
          salesCount: { $sum: 1 },
          orderAmount: { $sum: { $ifNull: ["$grand_total", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const byYear = new Map(rows.map((row) => [row._id, row]));
    chart = Array.from({ length: 5 }, (_, i) => {
      const y = startYear + i;
      const row = byYear.get(y);

      return {
        label: String(y),
        salesCount: Number(row?.salesCount || 0),
        orderAmount: round2(row?.orderAmount || 0)
      };
    });
  } else {
    const rows = await Order.aggregate([
      {
        $match: {
          ...match,
          order_date: {
            $gte: new Date(selectedYear, 0, 1),
            $lte: new Date(selectedYear, 11, 31, 23, 59, 59, 999)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$order_date" },
          salesCount: { $sum: 1 },
          orderAmount: { $sum: { $ifNull: ["$grand_total", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const byMonth = new Map(rows.map((row) => [row._id, row]));
    const monthLabels = getMonthLabels();

    chart = monthLabels.map((label, index) => {
      const row = byMonth.get(index + 1);

      return {
        label,
        salesCount: Number(row?.salesCount || 0),
        orderAmount: round2(row?.orderAmount || 0)
      };
    });
  }

  const topProductsAgg = await Order.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product_id",
        productName: { $first: "$items.product_name" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" }
      }
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: 10 }
  ]);

  const topProducts = topProductsAgg.map((row) => ({
    name: row.productName || "Unknown Product",
    unitsSold: Number(row.unitsSold || 0),
    revenue: round2(row.revenue || 0)
  }));

  const productIds = topProductsAgg.map((row) => row._id).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id category_id brand_id")
    .lean();

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const categoryCountMap = new Map();
  const brandCountMap = new Map();

  topProductsAgg.forEach((row) => {
    const product = productMap.get(String(row._id));
    if (!product) return;

    const categoryKey = String(product.category_id || "");
    const brandKey = String(product.brand_id || "");
    const units = Number(row.unitsSold || 0);

    if (categoryKey) {
      categoryCountMap.set(categoryKey, (categoryCountMap.get(categoryKey) || 0) + units);
    }

    if (brandKey) {
      brandCountMap.set(brandKey, (brandCountMap.get(brandKey) || 0) + units);
    }
  });

  const categoryIds = Array.from(categoryCountMap.keys());
  const brandIds = Array.from(brandCountMap.keys());

  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select("_id name")
    .lean();

  const brands = await Brand.find({ _id: { $in: brandIds } })
    .select("_id name")
    .lean();

  const categoryNameMap = new Map(categories.map((c) => [String(c._id), c.name]));
  const brandNameMap = new Map(brands.map((b) => [String(b._id), b.name]));

  const topCategories = Array.from(categoryCountMap.entries())
    .map(([id, unitsSold]) => ({
      name: categoryNameMap.get(id) || "Unknown Category",
      unitsSold: Number(unitsSold || 0)
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  const topBrands = Array.from(brandCountMap.entries())
    .map(([id, unitsSold]) => ({
      name: brandNameMap.get(id) || "Unknown Brand",
      unitsSold: Number(unitsSold || 0)
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  return {
    filter: {
      view,
      year: selectedYear
    },
    chart,
    topProducts,
    topCategories,
    topBrands
  };
}
