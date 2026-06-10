import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import YAML from "yaml";
import { connectDB } from "./src/api/config/db.js";
import authRoutes from "./src/api/v1/routes/auth/authRoutes.js";
import teamRoutes from "./src/api/v1/routes/team/teamRoutes.js";
import seasonRoutes from "./src/api/v1/routes/season/seasonRoutes.js";
import matchRoutes from "./src/api/v1/routes/match/matchRoutes.js";
import playerRoutes from "./src/api/v1/routes/player/playerRoutes.js";
import regulationRoutes from "./src/api/v1/routes/regulation/regulationRoutes.js";
import team_resultsRoutes from "./src/api/v1/routes/team/team_resultsRoutes.js";
import rankingRoutes from "./src/api/v1/routes/team/rankingRoutes.js";
import player_resultsRoutes from "./src/api/v1/routes/player/player_resultsRoutes.js";
import player_rankingsRoutes from "./src/api/v1/routes/player/player_rankingsRoutes.js";
import matchLineupRoutes from "./src/api/v1/routes/match/matchLineupRoutes.js"; // Added
import { errorMiddleware } from "./src/api/v1/middleware/errorMiddleware.js";
import userRoutes from "./src/api/v1/routes/user/userRoutes.js";
import chatRoutes from "./src/api/v1/routes/chat/chatRoutes.js";
import Message from "./src/models/Message.js";
import { seedActivityLogsForExistingUsers } from "./src/utils/activityLogger.js";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const file = fs.readFileSync("./Document/swagger.yaml", "utf8");
const swaggerDocument = YAML.parse(file);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // Frontend URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Định nghĩa các route API
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/matchlineups", matchLineupRoutes); // Added
app.use("/api/players", playerRoutes);
app.use("/api/regulations", regulationRoutes);
app.use("/api/team_results", team_resultsRoutes);
app.use("/api/rankings", rankingRoutes);
app.use("/api/player_results", player_resultsRoutes);
app.use("/api/player_rankings", player_rankingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.use(errorMiddleware);

// API Mặc định để kiểm tra server đang chạy
app.get("/", (req, res) => {
  res.send("⚽ API Football League is running...");
});

console.log("Môi trường hiện tại:", process.env.NODE_ENV || "chưa thiết lập");

// Kết nối MongoDB trước khi chạy server
connectDB()
  .then(async () => {
    // Khởi tạo nhật ký hoạt động cũ nếu cần
    await seedActivityLogsForExistingUsers();

    // Khởi tạo Socket.IO events
    io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // User or Admin joins their own room based on their ID/role
      socket.on("join_room", (userId) => {
        socket.join(userId);
        console.log(`👤 User/Admin joined room: ${userId}`);
      });

      // Handle sending messages
      socket.on("send_message", async (data) => {
        try {
          const { senderId, receiverId, content } = data;
          console.log(`💬 Message: ${senderId} → ${receiverId}: ${content}`);

          const newMessage = new Message({ senderId, receiverId, content });
          await newMessage.save();
          console.log(`✅ Message saved to DB: ${newMessage._id}`);

          // Emit to receiver's room and sender's room so both sides update
          io.to(receiverId).emit("receive_message", newMessage.toObject());
          io.to(senderId.toString()).emit("receive_message", newMessage.toObject());
          console.log(`📤 Emitted to rooms: ${receiverId}, ${senderId}`);
        } catch (error) {
          console.error("Socket send_message error:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    // Sau khi kết nối, mới khởi động server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Exit if DB connection fails
  });