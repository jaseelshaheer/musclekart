import jwt from "jsonwebtoken";
import {
  getSalesReportService,
  getDashboardAnalyticsService
} from "../../services/admin/adminReport.service.js";
import { generateSalesReportPdf } from "../../utils/generateSalesReportPdf.js";
import { generateSalesReportExcel } from "../../utils/generateSalesReportExcel.js";


function validateAdminDownloadToken(req) {
  const token = req.query.token;
  if (!token) throw new Error("Authorization token missing");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role !== "admin") {
    throw new Error("Admin access denied");
  }
}


function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN");
}

export const getReportsPage = (req, res) => {
  res.render("admin/reports", {
    layout: "layouts/layout",
    activePage: "reports"
  });
};

export const getReportsData = async (req, res, next) => {
  try {
    const data = await getSalesReportService(req.query);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const downloadReportsExcel = async (req, res, next) => {
  try {
    validateAdminDownloadToken(req);
    const reportData = await getSalesReportService(req.query);
    return generateSalesReportExcel(reportData, res);
  } catch (error) {
    next(error);
  }
};


export const downloadReportsPdf = async (req, res, next) => {
  try {
    validateAdminDownloadToken(req);
    const reportData = await getSalesReportService(req.query);
    return generateSalesReportPdf(reportData, res);
  } catch (error) {
    next(error);
  }
};

export const getDashboardData = async (req, res, next) => {
  try {
    const data = await getDashboardAnalyticsService(req.query);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
