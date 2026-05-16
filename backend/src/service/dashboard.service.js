import Order from "../model/order.model.js";
import Product from "../model/product.model.js";

export async function getSummaryStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [totalOrders, monthRevAgg, lastMonthRevAgg, totalProducts, lowStockCount] = await Promise.all([
    Order.countDocuments({ status: "confirmed" }),
    Order.aggregate([{ $match: { status: "confirmed", confirmedAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
    Order.aggregate([{ $match: { status: "confirmed", confirmedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ $expr: { $lte: ["$stock", "$lowStockThreshold"] }, isActive: true }),
  ]);

  const thisMonthRevenue = monthRevAgg[0]?.total || 0;
  const prevMonthRevenue = lastMonthRevAgg[0]?.total || 0;
  const revenueGrowth = prevMonthRevenue > 0
    ? +(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
    : null;

  return { totalOrders, thisMonthRevenue, prevMonthRevenue, revenueGrowth, totalProducts, lowStockCount };
}

export async function getMonthlySales(year) {
  const y = year || new Date().getFullYear();
  const data = await Order.aggregate([
    { $match: { status: "confirmed", confirmedAt: { $gte: new Date(`${y}-01-01`), $lte: new Date(`${y}-12-31T23:59:59`) } } },
    { $group: { _id: { month: { $month: "$confirmedAt" } }, revenue: { $sum: "$grandTotal" }, orders: { $sum: 1 } } },
    { $sort: { "_id.month": 1 } },
  ]);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map((name, idx) => {
    const found = data.find((d) => d._id.month === idx + 1);
    return { name, revenue: found?.revenue || 0, orders: found?.orders || 0 };
  });
}

export async function getWeeklySales() {
  const now = new Date();
  const sevenAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const data = await Order.aggregate([
    { $match: { status: "confirmed", confirmedAt: { $gte: sevenAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$confirmedAt" } }, revenue: { $sum: "$grandTotal" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    const found = data.find((x) => x._id === key);
    days.push({ name: d.toLocaleDateString("en-IN", { weekday: "short" }), date: key, revenue: found?.revenue || 0, orders: found?.orders || 0 });
  }
  return days;
}

export async function getYearCompare() {
  const y = new Date().getFullYear();
  const [cur, prev] = await Promise.all([getMonthlySales(y), getMonthlySales(y - 1)]);
  return cur.map((m, i) => ({ name: m.name, thisYear: m.revenue, lastYear: prev[i]?.revenue || 0 }));
}

export async function getLowStockProducts() {
  return Product.find({ $expr: { $lte: ["$stock", "$lowStockThreshold"] }, isActive: true })
    .select("name brand stock lowStockThreshold unit category itemType");
}

export async function getRecentOrders(limit = 8) {
  return Order.find()
    .populate("createdBy", "name username")
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("orderNumber status grandTotal customer confirmedAt createdAt createdBy");
}
