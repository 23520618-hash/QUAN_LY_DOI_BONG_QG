import express from "express";
import {
  registerUser,
  loginUser,
  updatePasswordUser,
  updateUsername,
  deleteUser,
  forgotPassword,
  resetPassword,
} from "../../controllers/auth/authController.js";
import { errorMiddleware } from "../../middleware/errorMiddleware.js";

const router = express.Router();

router.post("/register", registerUser); ///
router.post("/login", loginUser); ///
router.put("/password", updatePasswordUser); ///
router.put("/username", updateUsername); ///
router.delete("/", deleteUser); ///
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.use(errorMiddleware);

export default router;
