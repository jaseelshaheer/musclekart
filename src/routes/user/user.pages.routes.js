import express from "express";
// import { noCache } from "../../middlewares/cache.middleware.js";

const router = express.Router();



router.get("/signup", (req, res) => {
  res.render("user/signup", { layout: "layouts/user" });
});

router.get("/login", (req, res) => {
  res.render("user/login", { layout: "layouts/user" });
});

router.get("/verify-otp", (req, res) => {
  res.render("user/verify-otp", { layout: "layouts/user" });
});

router.get("/forgot-password", (req, res) => {
  res.render("user/forgot-password");
});

router.get("/reset-password", (req, res) => {
  res.render("user/reset-password", { layout: "layouts/user" });
});

router.get("/profile", (req, res) => {
  res.render("user/profile/profile-view", { layout: "layouts/user", activePage: "profile" });
});

router.get("/profile/edit", (req, res) => {
  res.render("user/profile/profile-edit", {
    layout: "layouts/user", activePage: "profile",
    user: res.locals.user,
  });
});
router.get("/profile/change-password", (req, res) => {

  if (req.user?.authProvider === "google") {
    return res.redirect("/profile");
  }

  res.render("user/profile/change-password", {
    layout: "layouts/user",
    activePage: "change-password"
  });

});

router.get("/addresses", (req, res) => {
  res.render("user/address/address-list", {
    layout: "layouts/user", activePage: "addresses",
    user: req.user || null,
   });
});


router.get("/addresses/new", (req, res) => {
  res.render("user/address/address-form", {
    layout: "layouts/user", activePage: "addresses",
    user: req.user || null,
    address: null
  });
});

router.get("/addresses/:id/edit", (req, res) => {
  res.render("user/address/address-form", {
    layout: "layouts/user", activePage: "addresses",
    user: req.user || null,
    address: { _id: req.params.id }
  });
});


router.get("/payment/success", (req, res) => {
  res.render("user/payment/payment-success", {
    layout: "layouts/user",
    orderId: req.query.orderId || ""
  });
});

router.get("/payment/failure", (req, res) => {
  res.render("user/payment/payment-failure", {
    layout: "layouts/user"
  });
});


export default router;