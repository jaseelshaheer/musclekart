import { getProfileService, updateProfileService, requestEmailChangeService, verifyEmailChangeService, changePasswordService, addAddressService, updateAddressService, deleteAddressService, getAddressesService, setDefaultAddressService } from "../../services/user/profile.service.js";
import { sendEmail } from "../../utils/email.js";
import cloudinary from "../../config/cloudinary.js";
import HTTP_STATUS from "../../constants/httpStatus.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await getProfileService(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const updateData = {
      ...req.body,
    };
    updateData.firstName = updateData.firstName?.trim();
    updateData.lastName = updateData.lastName?.trim();
    updateData.phone = updateData.phone?.trim();

    // image uploading to cloud
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        {
          folder: "musclekart/profile",
          transformation: [
            { width: 400, height: 400, crop: "fill" },
          ],
        },
        async (error, result) => {
          if (error) {
            throw new Error("Image upload failed");
          }

          updateData.profileImage = result.secure_url;

          const updatedUser = await updateProfileService(userId, updateData);

          return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
          });
        }
      );

      uploadResult.end(req.file.buffer);
      return;
    }

    const updatedUser = await updateProfileService(userId, updateData);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });

  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};




export const requestEmailChange = async (req, res) => {
  if (req.user.authProvider === "google") {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Email change is not allowed for Google accounts."
    });
  }

  try {
    const userId = req.user._id;
    const { newEmail } = req.body;

    if (!newEmail) {
      throw new Error("New email is required");
    }

    const { otp } = await requestEmailChangeService(userId, newEmail);

    await sendEmail({
      to: newEmail,
      subject: "Verify your new email",
      html: `
        <h2>Email Change Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "OTP sent to new email address",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};


export const verifyEmailChange = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otp } = req.body;

    await verifyEmailChangeService(userId, otp);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Email updated successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};


export const changePassword = async (req, res) => {
    console.log(req.user);
  if (req.user.authProvider === "google") {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Password change is not allowed for Google accounts."
    });
  }
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new Error("Both current and new password are required");
    }

    await changePasswordService(user, currentPassword, newPassword);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      phone,
      house,
      country,
      district,
      state,
      pincode,
    } = req.body;

    // 🔒 Backend validation
    if (!name?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Name is required" });

    if (!/^[0-9]{10}$/.test(phone))
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid phone number" });

    if (!house?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "House is required" });

    if (!district?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "District is required" });

    if (!state?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "State is required" });

    if (!/^[0-9]{6}$/.test(pincode))
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid pincode" });

    const address = await addAddressService(userId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Address added successfully",
      data: address,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};



export const updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    const {
      name,
      phone,
      house,
      country,
      district,
      state,
      pincode,
    } = req.body;

    // 🔒 Backend validation
    if (!name?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Name is required" });

    if (!/^[0-9]{10}$/.test(phone))
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid phone number" });

    if (!house?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "House is required" });

    if (!district?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "District is required" });

    if (!state?.trim())
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "State is required" });

    if (!/^[0-9]{6}$/.test(pincode))
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid pincode" });

    const updatedAddress = await updateAddressService(
      userId,
      addressId,
      req.body
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    await deleteAddressService(userId, addressId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Logged in user:", req.user._id);

    const addresses = await getAddressesService(userId);
    console.log("Addresses found:", addresses.length);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};


export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    await setDefaultAddressService(userId, addressId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Default address updated successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};