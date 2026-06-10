import express from "express";
import { getChatHistory, getChatUsers } from "../../controllers/chat/chatController.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { errorMiddleware } from "../../middleware/errorMiddleware.js";

const router = express.Router();

router.get("/users", authenticateToken, getChatUsers);
router.get("/history/:userId", authenticateToken, getChatHistory);
router.get("/history", authenticateToken, getChatHistory); // For normal users to get their own history

router.use(errorMiddleware);

export default router;
