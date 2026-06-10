import jwt from "jsonwebtoken";
import User from "../../../models/User.js";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, async (err, tokenUser) => {
    if (err) return res.sendStatus(403);
    try {
      const dbUser = await User.findById(tokenUser.user_id);
      if (!dbUser) {
        return res.status(401).json({ success: false, message: "Tài khoản không tồn tại." });
      }
      if (dbUser.isBlocked) {
        return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
      }
      req.user = {
        user_id: dbUser._id,
        email: dbUser.email,
        role: dbUser.role,
        username: dbUser.username,
        permissions: dbUser.permissions || []
      };
      next();
    } catch (e) {
      return res.sendStatus(500);
    }
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Require Admin Role!" });
  }
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role === "admin") {
      return next();
    }
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ success: false, message: `Require ${permission} permission!` });
  };
};

export { authenticateToken, isAdmin, checkPermission };
