import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../../models/User.js"; // Import model User
import {
  RegisterSchema,
  LoginSchema,
  UpdatePasswordSchema,
  UpdateUsernameSchema,
  DeleteUserSchema,
} from "../../../../schemas/userSchema.js"; // Import schemas
import { successResponse } from "../../../../utils/responseFormat.js";
import { logActivity } from "../../../../utils/activityLogger.js";
import sendEmail from "../../../../utils/sendEmail.js";
import crypto from "crypto";

// Đăng ký tài khoản
const registerUser = async (req, res, next) => {
  const { username, email, password, adminCode } = req.body;
  try {
    // Validate schema với Zod
    const { success, error } = RegisterSchema.safeParse({
      username,
      email,
      password,
      adminCode,
    });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("Email này đã được sử dụng. Vui lòng sử dụng email khác.");
      error.status = 400;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = adminCode === "0000" ? "admin" : "user";
    
    const user = new User({
      username,
      email,
      password: hashedPassword,
      userpassword: password,
      role,
    });

    const savedUser = await user.save();

    const fakeReq = {
      user: {
        user_id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email
      },
      headers: req.headers,
      socket: req.socket
    };
    await logActivity(fakeReq, "Đăng ký", `Đăng ký tài khoản mới: ${savedUser.username} (${savedUser.email})`);

    return successResponse(
      res,
      { userId: savedUser._id, role: savedUser.role },
      "Created user successfully",
      201
    );
  } catch (error) {
    console.error("❌ [DEBUG] Lỗi trong registerUser:", error);
    return next(error);
  }
};

// Đăng nhập tài khoản
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Validate schema với Zod
    const { success, error } = LoginSchema.safeParse({ email, password });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
      error.status = 401;
      return next(error);
    }

    if (user.isBlocked) {
      const error = new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
      error.status = 403;
      return next(error);
    }

    const token = jwt.sign(
      { user_id: user._id, email, role: user.role, permissions: user.permissions },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    const fakeReq = {
      user: {
        user_id: user._id,
        username: user.username,
        email: user.email
      },
      headers: req.headers,
      socket: req.socket
    };
    await logActivity(fakeReq, "Đăng nhập", `Đăng nhập thành công vào hệ thống`);

    return successResponse(res, { token, role: user.role, username: user.username, permissions: user.permissions }, "Login successful");
  } catch (error) {
    console.error("❌ [DEBUG] Lỗi trong loginUser:", error);
    return next(error);
  }
};

// Cập nhật mật khẩu
const updatePasswordUser = async (req, res, next) => {
  const { email, oldpassword, newpassword } = req.body;
  try {
    // Validate schema với Zod
    const { success, error } = UpdatePasswordSchema.safeParse({
      email,
      oldpassword,
      newpassword,
    });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Không tìm thấy tài khoản với email này.");
      error.status = 404;
      return next(error);
    }
    if (!(await bcrypt.compare(oldpassword, user.password))) {
      const error = new Error("Mật khẩu cũ không chính xác.");
      error.status = 401;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedPassword;
    await user.save();

    const fakeReq = {
      user: {
        user_id: user._id,
        username: user.username,
        email: user.email
      },
      headers: req.headers,
      socket: req.socket
    };
    await logActivity(fakeReq, "Đổi mật khẩu", `Đổi mật khẩu tài khoản thành công`);

    return successResponse(res, null, "Update password successfully");
  } catch (error) {
    console.error("❌ [DEBUG] Lỗi trong updatePasswordUser:", error);
    return next(error);
  }
};

// Cập nhật tên người dùng
const updateUsername = async (req, res, next) => {
  const { email, Inputpassword, newusername } = req.body;
  try {
    // Validate schema với Zod
    const { success, error } = UpdateUsernameSchema.safeParse({
      email,
      Inputpassword,
      newusername,
    });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Không tìm thấy tài khoản với email này.");
      error.status = 404;
      return next(error);
    }
    if (!(await bcrypt.compare(Inputpassword, user.password))) {
      const error = new Error("Mật khẩu không chính xác.");
      error.status = 401;
      return next(error);
    }

    const oldUsername = user.username;
    user.username = newusername;
    await user.save();

    const fakeReq = {
      user: {
        user_id: user._id,
        username: user.username,
        email: user.email
      },
      headers: req.headers,
      socket: req.socket
    };
    await logActivity(fakeReq, "Đổi Username", `Đổi tên tài khoản từ "${oldUsername}" sang "${newusername}"`);

    return successResponse(res, null, "Update Username successfully");
  } catch (error) {
    console.error("❌ [DEBUG] Lỗi trong updateUsername:", error);
    return next(error);
  }
};

// Xóa người dùng
const deleteUser = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Validate schema với Zod
    const { success, error } = DeleteUserSchema.safeParse({ email, password });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Không tìm thấy tài khoản với email này.");
      error.status = 404;
      return next(error);
    }
    if (!(await bcrypt.compare(password, user.password))) {
      const error = new Error("Mật khẩu không chính xác.");
      error.status = 401;
      return next(error);
    }

    const fakeReq = {
      user: {
        user_id: user._id,
        username: user.username,
        email: user.email
      },
      headers: req.headers,
      socket: req.socket
    };
    await logActivity(fakeReq, "Xóa tài khoản", `Người dùng đã tự xóa tài khoản của mình (${email})`);

    await User.deleteOne({ email });

    return successResponse(res, null, "Delete user successfully");
  } catch (error) {
    console.error("❌ [DEBUG] Lỗi trong deleteUser:", error);
    return next(error);
  }
};

// Quên mật khẩu
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Không tìm thấy người dùng với email này.");
      error.status = 404;
      return next(error);
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    const resetUrl = `http://localhost:5174/reset-password/${resetToken}`;

    const message = `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng truy cập đường dẫn sau để đặt lại mật khẩu:\n\n${resetUrl}\n\nLink này sẽ hết hạn sau 15 phút.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Đặt lại mật khẩu - Quản lý giải bóng đá",
        message,
        html: `
          <h3>Xin chào ${user.username},</h3>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại hệ thống Quản lý giải bóng đá.</p>
          <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu (link có hiệu lực trong 15 phút):</p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#dc2626;color:#ffffff;text-decoration:none;border-radius:5px;font-weight:bold;">Đặt Lại Mật Khẩu</a>
          <p>Nếu bạn không yêu cầu điều này, xin hãy bỏ qua email này.</p>
        `
      });

      return successResponse(res, null, "Email sent successfully");
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      const error = new Error("Không thể gửi email lúc này.");
      error.status = 500;
      return next(error);
    }
  } catch (error) {
    return next(error);
  }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error("Mã khôi phục không hợp lệ hoặc đã hết hạn.");
      error.status = 400;
      return next(error);
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      const error = new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      error.status = 400;
      return next(error);
    }

    user.password = await bcrypt.hash(password, 10);
    user.userpassword = password; // Track original (unsafe but keeping original logic)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const fakeReq = {
      user: { user_id: user._id, username: user.username, email: user.email },
      headers: req.headers,
      socket: req.socket
    };
    await logActivity(fakeReq, "Quên mật khẩu", `Tài khoản đã khôi phục mật khẩu thành công`);

    return successResponse(res, null, "Password reset successfully");
  } catch (error) {
    return next(error);
  }
};

export {
  registerUser,
  loginUser,
  updatePasswordUser,
  updateUsername,
  deleteUser,
  forgotPassword,
  resetPassword
};
