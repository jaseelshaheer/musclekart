import User from "../../models/user.model.js";

export const getUsersService = async ({ page = 1, limit = 10, search = "" }) => {
  const skip = (page - 1) * limit;

  const searchQuery = search
    ? {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const users = await User.find(searchQuery)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const totalUsers = await User.countDocuments(searchQuery);

  return {
    users,
    totalUsers,
    currentPage: Number(page),
    totalPages: Math.ceil(totalUsers / limit)
  };
};

export const updateUserStatusService = async (targetUserId, isBlocked) => {
  const user = await User.findById(targetUserId);

  if (!user) {
    throw new Error("User not found");
  }

  user.isBlocked = isBlocked;
  await user.save();

  return {
    id: user._id,
    isBlocked: user.isBlocked
  };
};
