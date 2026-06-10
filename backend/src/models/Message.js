import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId (user) or 'admin' string
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.Mixed, // Can be 'admin' string or ObjectId (user)
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// TTL Index: MongoDB tự động xóa tin nhắn sau 24 giờ (86400 giây)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
