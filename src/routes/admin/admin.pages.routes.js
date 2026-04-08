import express from "express";
// import { adminAuth } from "../../middlewares/adminAuth.middleware.js"
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("admin/login", { layout: "layouts/layout" });
});

router.get("/dashboard",(req, res) => {
  res.render("admin/dashboard", { layout: "layouts/layout", activePage: "dashboard"});
});

router.get("/users-list", (req, res) => {
  res.render("admin/users", { layout: "layouts/layout", activePage: "customers" });
});

export default router;