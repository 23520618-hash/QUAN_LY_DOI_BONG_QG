import express from "express";
import { authenticateToken, isAdmin } from "../../middleware/authMiddleware.js";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  getActivityLogs,
  deleteUserByAdmin,
  updateUserRoleByAdmin,
  updateUserPermissions
} from "../../controllers/user/userController.js";

const router = express.Router();

// Tất cả các route bên dưới cần đăng nhập và có quyền Admin
router.use(authenticateToken);
router.use(isAdmin);

router.get("/", getAllUsers);
router.get("/logs", getActivityLogs);
router.put("/:id/block", blockUser);
router.put("/:id/unblock", unblockUser);
router.put("/:id/role", updateUserRoleByAdmin);
router.put("/:id/permissions", updateUserPermissions);
router.delete("/:id", deleteUserByAdmin);

export default router;
