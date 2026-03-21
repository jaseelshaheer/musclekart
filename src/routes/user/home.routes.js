import express from "express";
import { getHome } from "../../controllers/user/home.controller.js";

const router = express.Router();

router.get("/home", getHome);
router.get("/", (req, res) => {
  res.redirect("/home");
});

export default router;