import User from "../models/user.model.js";
import { generateOTP, hashOTP, compareOTP} from "../utils/otp.js";

export const generateOTPService = async (userId, type) => {
  const otp = generateOTP();
  const hashedOTP = hashOTP(otp);

  await User.findByIdAndUpdate(userId, {
    otp: hashedOTP,
    otpExpiresAt: Date.now() + 5 * 60 * 1000,
  });

  return otp; 
};

export const verifyOTPService = async (userId, otp) => {
  
    const user = await User.findById(userId).select("+otp +otpExpiresAt");

    // console.log("Stored OTP:", user.otp);
    // console.log("Incoming OTP:", otp);
    // console.log("Expires at:", user.otpExpiresAt);
    // console.log("Now:", Date.now());

    if(!user || !user.otp || !user.otpExpiresAt){
        throw new Error("OTP not found");
    }

    if(user.otpExpiresAt < Date.now()){
        throw new Error("OTP Expired");
    }

    const isValid = compareOTP(otp, user.otp);
    if(!isValid){
        throw new Error("Invalid OTP");
    }

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return true;
}