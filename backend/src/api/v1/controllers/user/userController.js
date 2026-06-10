import User from "../../../../models/User.js";
import ActivityLog from "../../../../models/ActivityLog.js";
import { successResponse } from "../../../../utils/responseFormat.js";
import { logActivity } from "../../../../utils/activityLogger.js";

// GET all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -userpassword").sort({ createdAt: -1 });
    return successResponse(res, users, "Fetched all users successfully");
  } catch (error) {
    return next(error);
  }
};

// Block user
export const blockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.user_id.toString()) {
      const error = new Error("Bạn không thể tự khóa tài khoản của chính mình.");
      error.status = 400;
      return next(error);
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      const error = new Error("Không tìm thấy người dùng.");
      error.status = 404;
      return next(error);
    }

    user.isBlocked = true;
    await user.save();

    await logActivity(req, "Khóa tài khoản", `Đã khóa tài khoản của người dùng: ${user.username} (${user.email})`);

    return successResponse(res, user, "Blocked user successfully");
  } catch (error) {
    return next(error);
  }
};

// Unblock user
export const unblockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(targetUserId);
    if (!user) {
      const error = new Error("Không tìm thấy người dùng.");
      error.status = 404;
      return next(error);
    }

    user.isBlocked = false;
    await user.save();

    await logActivity(req, "Mở khóa tài khoản", `Đã mở khóa tài khoản cho người dùng: ${user.username} (${user.email})`);

    return successResponse(res, user, "Unblocked user successfully");
  } catch (error) {
    return next(error);
  }
};

// Update user role
export const updateUserRoleByAdmin = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      const error = new Error("Vai trò không hợp lệ.");
      error.status = 400;
      return next(error);
    }

    if (targetUserId === req.user.user_id.toString()) {
      const error = new Error("Bạn không thể tự thay đổi vai trò của chính mình.");
      error.status = 400;
      return next(error);
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      const error = new Error("Không tìm thấy người dùng.");
      error.status = 404;
      return next(error);
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logActivity(req, "Thay đổi vai trò", `Đã thay đổi vai trò của người dùng ${user.username} từ "${oldRole}" sang "${role}"`);

    return successResponse(res, user, "Updated user role successfully");
  } catch (error) {
    return next(error);
  }
};

// Update user permissions
export const updateUserPermissions = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      const error = new Error("Permissions must be an array.");
      error.status = 400;
      return next(error);
    }

    if (targetUserId === req.user.user_id.toString()) {
      const error = new Error("Bạn không thể tự thay đổi quyền của chính mình.");
      error.status = 400;
      return next(error);
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      const error = new Error("Không tìm thấy người dùng.");
      error.status = 404;
      return next(error);
    }

    user.permissions = permissions;
    await user.save();

    await logActivity(req, "Thay đổi quyền", `Đã cập nhật quyền truy cập cho người dùng ${user.username}`);

    return successResponse(res, user, "Updated user permissions successfully");
  } catch (error) {
    return next(error);
  }
};

// Delete user by admin
export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.user_id.toString()) {
      const error = new Error("Bạn không thể tự xóa tài khoản của chính mình.");
      error.status = 400;
      return next(error);
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      const error = new Error("Không tìm thấy người dùng.");
      error.status = 404;
      return next(error);
    }

    await logActivity(req, "Xóa tài khoản", `Admin đã xóa tài khoản của người dùng: ${user.username} (${user.email})`);
    
    await User.deleteOne({ _id: targetUserId });

    return successResponse(res, null, "Deleted user successfully");
  } catch (error) {
    return next(error);
  }
};

// Get activity logs
export const getActivityLogs = async (req, res, next) => {
  try {
    const { search, action, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action) {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const totalLogs = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: totalLogs,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalLogs / limitNum)
      },
      message: "Fetched activity logs successfully"
    });
  } catch (error) {
    return next(error);
  }
};
