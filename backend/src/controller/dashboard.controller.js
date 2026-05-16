import * as dashboardService from "../service/dashboard.service.js";

function sendError(res, error) {
  const status = error?.status || 500;
  const message = error?.message || "Something went wrong";
  if (status >= 500) console.error(error);
  return res.status(status).json({ success: false, message });
}

async function summary(req, res) {
  try {
    const data = await dashboardService.getSummaryStats();
    return res.status(200).json({ success: true, data });
  } catch (e) { return sendError(res, e); }
}

async function monthlySales(req, res) {
  try {
    const data = await dashboardService.getMonthlySales(req.query.year);
    return res.status(200).json({ success: true, data });
  } catch (e) { return sendError(res, e); }
}

async function weeklySales(req, res) {
  try {
    const data = await dashboardService.getWeeklySales();
    return res.status(200).json({ success: true, data });
  } catch (e) { return sendError(res, e); }
}

async function yearCompare(req, res) {
  try {
    const data = await dashboardService.getYearCompare();
    return res.status(200).json({ success: true, data });
  } catch (e) { return sendError(res, e); }
}

async function lowStock(req, res) {
  try {
    const data = await dashboardService.getLowStockProducts();
    return res.status(200).json({ success: true, data });
  } catch (e) { return sendError(res, e); }
}

async function recentOrders(req, res) {
  try {
    const data = await dashboardService.getRecentOrders(Number(req.query.limit) || 8);
    return res.status(200).json({ success: true, data });
  } catch (e) { return sendError(res, e); }
}

export default { summary, monthlySales, weeklySales, yearCompare, lowStock, recentOrders };
