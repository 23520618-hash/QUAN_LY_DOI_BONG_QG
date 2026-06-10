import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userpassword: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    permissions: {
      type: [String],
      default: [], // e.g. 'manage_seasons', 'manage_teams', 'manage_players', 'manage_matches', 'manage_regulations'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
