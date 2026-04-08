import HTTP_STATUS from "../../constants/httpStatus.js";
import { getWalletService } from "../../services/user/wallet.service.js";

export const getWalletPage = async (req, res) => {
  res.render("user/wallet/wallet", {
    layout: "layouts/user",
    activePage: "wallet"
  });
};

export const getWalletData = async (req, res) => {
  try {
    const result = await getWalletService(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to load wallet"
    });
  }
};
