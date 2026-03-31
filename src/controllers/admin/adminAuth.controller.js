import { adminLogin } from "../../services/auth.service.js";
import { generateToken } from "../../utils/jwt.js";
import HTTP_STATUS from "../../constants/httpStatus.js";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await adminLogin(email, password);

    const token = generateToken({
      userId: admin._id,
      role: admin.role,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
        },
      },
    });

  } catch (err) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: err.message,
    });
  }
};
