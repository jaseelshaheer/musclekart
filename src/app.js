import express from "express"
// import { attachUserToViews } from "./middlewares/view.middleware.js";
import authRoutes from "./routes/user/auth.routes.js";
import adminUserRoutes from "./routes/admin/user.routes.js";
import adminPagesRoutes from "./routes/admin/admin.pages.routes.js";
import adminAuthRoutes from "./routes/admin/adminAuth.routes.js";
import userProfileRoutes from "./routes/user/profile.routes.js";
import homeRoutes from "././routes/user/home.routes.js";
import userPageRoutes from "./routes/user/user.pages.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";
import { errorHandler } from "./middlewares/error.middleware.js";
import passport from "./config/passport.js";
import nocache from "nocache";
// import helmet from "helmet";
import adminCategoryRoutes from "./routes/admin/adminCategory.routes.js"
import adminBrandRoutes from "./routes/admin/adminBrand.routes.js"
import adminProductRoutes from "./routes/admin/product.routes.js"
import userProductRoutes from "./routes/user/shop.routes.js"
import cartRoutes from "./routes/user/cart.routes.js";
import checkoutRoutes from "./routes/user/checkout.routes.js";
import orderRoutes from "./routes/user/order.routes.js";
import adminOrderRoutes from "./routes/admin/adminOrder.routes.js";
import wishlistRoutes from "./routes/user/wishlist.routes.js";
import adminCouponRoutes from "./routes/admin/adminCoupon.routes.js";
import couponRoutes from "./routes/user/coupon.routes.js";
import walletRoutes from "./routes/user/wallet.routes.js";
import paymentRoutes from "./routes/user/payment.routes.js";
import adminReportRoutes from "./routes/admin/adminReport.routes.js";



const app = express();

// app.use(helmet());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(passport.initialize());

app.use(expressLayouts);
app.set("layout", "layouts/layout");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "..", "public")));

app.set("trust proxy", 1);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({extended: true, limit: "10kb" }));
app.use(nocache());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use('/auth', authRoutes);
app.use("/admin", adminUserRoutes);
app.use("/admin", adminPagesRoutes);
app.use("/admin", adminAuthRoutes);
app.use("/admin", adminCategoryRoutes);
app.use("/admin", adminBrandRoutes);
app.use("/admin", adminProductRoutes);
app.use("/admin", adminOrderRoutes);
app.use("/admin", adminCouponRoutes);
app.use("/admin", adminReportRoutes);

app.use("/user", userProfileRoutes);
app.use("/", userProductRoutes);
app.use("/", homeRoutes);
app.use("/", cartRoutes);
app.use("/", checkoutRoutes);
app.use("/", orderRoutes);
app.use("/", wishlistRoutes);
app.use("/", couponRoutes);
app.use("/", paymentRoutes);
app.use("/", walletRoutes);



app.use("/", userPageRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use(errorHandler);

export default app;