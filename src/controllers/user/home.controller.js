// import { getHomeService } from "../../services/user/home.service.js";

export const getHome = (req, res) => {
  res.render("home", { layout: "layouts/user" });
};