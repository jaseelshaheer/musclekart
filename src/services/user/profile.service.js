import { generateOTPService, verifyOTPService } from "../otp.service.js";
import User from "../../models/user.model.js";
import Address from "../../models/address.model.js";
import bcrypt from "bcrypt";
import { ADDRESS_MESSAGES } from "../../constants/messages.js";

export const getProfileService = async (userId) => {
  const user = await User.findById(userId).select("-password -otp -otpExpiresAt");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateProfileService = async (userId, updateData) => {
  const allowedFields = ["firstName", "lastName", "phone", "profileImage"];

  const filteredData = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      filteredData[key] = updateData[key];
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, filteredData, { new: true }).select(
    "-password -otp -otpExpiresAt"
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

export const requestEmailChangeService = async (userId, newEmail) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (newEmail === user.email) {
    throw new Error("New email must be different from current email");
  }

  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) {
    throw new Error("Email already in use");
  }

  user.pendingEmail = newEmail;

  const otp = await generateOTPService(user._id);

  await user.save();

  return { otp };
};

export const verifyEmailChangeService = async (userId, otp) => {
  const user = await User.findById(userId).select("+otp +otpExpiresAt");

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.pendingEmail) {
    throw new Error("No email change requested");
  }

  await verifyOTPService(userId, otp);

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;

  await user.save();

  return true;
};

export const changePasswordService = async (user, currentPassword, newPassword) => {
  if (!user) {
    throw new Error("User not found");
  }

  currentPassword = currentPassword.trim();
  newPassword = newPassword.trim();

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!strongPasswordRegex.test(newPassword)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
    );
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password cannot be same as current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  await user.save();

  return true;
};

export const addAddressService = async (userId, addressData) => {
  const address = await Address.create({
    ...addressData,
    user: userId
  });

  return address;
};

export const updateAddressService = async (userId, addressId, updateData) => {
  const address = await Address.findOne({
    _id: addressId,
    user: userId
  });

  if (!address) {
    throw new Error(ADDRESS_MESSAGES.NOT_FOUND);
  }

  Object.assign(address, updateData);
  await address.save();

  return address;
};

export const deleteAddressService = async (userId, addressId) => {
  const address = await Address.findOne({
    _id: addressId,
    user: userId
  });

  if (!address) {
    throw new Error(ADDRESS_MESSAGES.NOT_FOUND);
  }

  await address.deleteOne();
};

export const getAddressesService = async (userId) => {
  const addresses = await Address.find({ user: userId }).sort({
    createdAt: -1
  });

  return addresses;
};

export const setDefaultAddressService = async (userId, addressId) => {
  await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });

  const address = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { isDefault: true },
    { new: true }
  );

  if (!address) {
    throw new Error(ADDRESS_MESSAGES.NOT_FOUND);
  }

  return address;
};
