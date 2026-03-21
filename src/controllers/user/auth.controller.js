import { createUser, verifySignupOTPService, loginUser, resendSignupOTPService, forgotPasswordService, resetPasswordService } from "../../services/auth.service.js";
import { generateToken } from "../../utils/jwt.js";
import HTTP_STATUS from "../../constants/httpStatus.js";
import { AUTH_MESSAGES } from "../../constants/messages.js";

export const signup = async (req, res, next) => {
  try {
    const userData = req.body;

    const newUser = await createUser(userData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: AUTH_MESSAGES.SIGNUP_SUCCESS,
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};


export const resendSignupOTP = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await resendSignupOTPService(email, type);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const verifySignupOTP = async (req, res) => {
    try{
        const {email, otp, type} = req.body;
        if(!email || !otp){
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        await verifySignupOTPService(email, otp, type);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        })

    }catch(err){
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);
    const token = generateToken({
        userId: user._id,
        role: user.role,
    })

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user:{
            id: user._id,
            email: user.email,
            user: user.role,
        }
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    await forgotPasswordService(email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to registered email",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    await resetPasswordService(email, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const token = generateToken({
      userId: user._id,
      role: user.role,
    });

    // redirect to frontend with token
    return res.redirect(
      `http://localhost:3010/google-success?token=${token}`
    );
  } catch (error) {
    return res.redirect("/login");
  }
};
