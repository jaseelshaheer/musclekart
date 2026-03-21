import HTTP_STATUS from "../../constants/httpStatus.js";
import { USER_MESSAGES, COMMON_MESSAGES } from "../../constants/messages.js";
import { getUsersService } from "../../services/admin/user.service.js";
import { updateUserStatusService } from "../../services/admin/user.service.js";

export const getUsers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const result = await getUsersService({
      page,
      limit,
      search,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: USER_MESSAGES.FETCH_SUCCESS,
      data: result,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: COMMON_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};


export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== "boolean") {
      throw new Error("Invalid status value");
    }

    const updatedUser = await updateUserStatusService(
      userId,
      isBlocked
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: isBlocked
        ? USER_MESSAGES.BLOCKED
        : USER_MESSAGES.UNBLOCKED,
      data: updatedUser,
    });
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

