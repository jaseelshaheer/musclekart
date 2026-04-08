import express from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import {
  getReportsPage,
  getReportsData,
  downloadReportsExcel,
  downloadReportsPdf,
  getDashboardData
} from "../../controllers/admin/adminReport.controller.js";

const router = express.Router();

router.get("/reports", getReportsPage);
router.get("/reports/data", adminAuth, getReportsData);
router.get("/reports/download/excel", downloadReportsExcel);
router.get("/reports/download/pdf", downloadReportsPdf);

router.get("/dashboard/data", adminAuth, getDashboardData);

export default router;
