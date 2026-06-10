import Message from "../../../../models/Message.js";
import User from "../../../../models/User.js";
import { successResponse } from "../../../../utils/responseFormat.js";
import mongoose from "mongoose";

// Fetch chat history between a user and admin
export const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const role = req.user.role;
    
    // If user is admin, they can request chat history with any specific user
    // If user is normal user, they can only request their own chat history with admin
    const targetUserId = role === "admin" ? req.params.userId : userId;
    const targetStr = targetUserId?.toString();

    // Try to get ObjectId version if valid
    let targetObjId = null;
    try { targetObjId = new mongoose.Types.ObjectId(targetStr); } catch(e) {}

    const orConditions = [
      { senderId: targetStr, receiverId: "admin" },
      { senderId: "admin", receiverId: targetStr },
    ];
    if (targetObjId) {
      orConditions.push({ senderId: targetObjId, receiverId: "admin" });
      orConditions.push({ senderId: "admin", receiverId: targetObjId });
    }

    const messages = await Message.find({ $or: orConditions })
      .sort({ createdAt: 1 })
      .lean();

    return successResponse(res, messages, "Chat history fetched successfully");
  } catch (error) {
    next(error);
  }
};

// Fetch list of users who have chatted (Admin only)
export const getChatUsers = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      const error = new Error("Chỉ admin mới có quyền xem danh sách chat");
      error.status = 403;
      return next(error);
    }

    // Get all messages involving admin
    const messages = await Message.find({
      $or: [{ receiverId: "admin" }, { senderId: "admin" }]
    }).lean();

    // Extract unique user IDs (non-admin side)
    const userIdSet = new Set();
    messages.forEach(msg => {
      if (msg.senderId !== "admin") userIdSet.add(msg.senderId?.toString());
      if (msg.receiverId !== "admin") userIdSet.add(msg.receiverId?.toString());
    });

    const uniqueUserIds = [...userIdSet].filter(Boolean);

    const users = await User.find(
      { _id: { $in: uniqueUserIds } },
      "username email isBlocked role"
    ).lean();

    return successResponse(res, users, "Chat users fetched successfully");
  } catch (error) {
    next(error);
  }
};
