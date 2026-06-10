import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Season from "../models/Season.js";
import Match from "../models/Match.js";

export const logActivity = async (req, action, details) => {
  try {
    let userId = null;
    let username = "Hệ thống";
    let email = "system@football.com";

    if (req && req.user) {
      userId = req.user.user_id || req.user._id;
      username = req.user.username || username;
      email = req.user.email || email;
    }

    const ipAddress = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress) : null;

    const log = new ActivityLog({
      userId,
      username,
      email,
      action,
      details,
      ipAddress,
    });

    await log.save();
    console.log(`[ACTIVITY LOG] User: ${username} (${email}) - Action: ${action} - Details: ${details}`);
  } catch (error) {
    console.error("❌ Error writing activity log:", error);
  }
};

export const seedActivityLogsForExistingUsers = async () => {
  try {
    const logCount = await ActivityLog.countDocuments();
    if (logCount > 0) {
      console.log("ℹ️ Activity logs already exist. Skipping historic data migration.");
      return;
    }

    console.log("🚀 Starting historic activity log seeding...");

    // Find the first admin user to assign historical data creations (or fallback to System)
    const adminUser = await User.findOne({ role: "admin" });
    const adminId = adminUser ? adminUser._id : null;
    const adminName = adminUser ? adminUser.username : "Hệ thống (Tự động)";
    const adminEmail = adminUser ? adminUser.email : "system@football.com";

    // 1. Seed user registrations
    const users = await User.find();
    for (const u of users) {
      const isSystemAdmin = u.email === adminEmail;
      const log = new ActivityLog({
        userId: u._id,
        username: u.username,
        email: u.email,
        action: "Đăng ký",
        details: isSystemAdmin 
          ? "Đăng ký tài khoản quản trị viên (Tự động lưu vết từ ngày tạo tài khoản)"
          : "Đăng ký tài khoản người dùng mới (Tự động lưu vết từ ngày tạo tài khoản)",
        createdAt: u.createdAt,
        updatedAt: u.createdAt,
      });
      await log.save();
    }
    console.log(`✅ Seeded ${users.length} user registrations.`);

    // 2. Seed season creations
    const seasons = await Season.find();
    for (const s of seasons) {
      const log = new ActivityLog({
        userId: adminId,
        username: adminName,
        email: adminEmail,
        action: "Tạo mùa giải",
        details: `Đã tạo mùa giải mới: "${s.season_name}" (Từ ngày ${new Date(s.start_date).toLocaleDateString('vi-VN')} đến ${new Date(s.end_date).toLocaleDateString('vi-VN')})`,
        createdAt: s.createdAt,
        updatedAt: s.createdAt,
      });
      await log.save();
    }
    console.log(`✅ Seeded ${seasons.length} seasons.`);

    // 3. Seed team creations
    const teams = await Team.find().populate("season_id");
    for (const t of teams) {
      const log = new ActivityLog({
        userId: adminId,
        username: adminName,
        email: adminEmail,
        action: "Tạo đội bóng",
        details: `Đã tạo đội bóng: "${t.team_name}" (Sân nhà: ${t.stadium}, HLV: ${t.coach}) trong mùa giải "${t.season_id?.season_name || 'Không rõ'}"`,
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
      });
      await log.save();
    }
    console.log(`✅ Seeded ${teams.length} teams.`);

    // 4. Seed player registrations
    const players = await Player.find().populate("team_id");
    for (const p of players) {
      const log = new ActivityLog({
        userId: adminId,
        username: adminName,
        email: adminEmail,
        action: "Thêm cầu thủ",
        details: `Đã thêm cầu thủ: "${p.name}" (Số áo: ${p.number}, Vị trí: ${p.position}, QG: ${p.nationality}) vào đội bóng "${p.team_id?.team_name || 'Không rõ'}"`,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      });
      await log.save();
    }
    console.log(`✅ Seeded ${players.length} players.`);

    // 5. Seed match scheduling
    const matches = await Match.find().populate("team1 team2 season_id");
    for (const m of matches) {
      const log = new ActivityLog({
        userId: adminId,
        username: adminName,
        email: adminEmail,
        action: "Tạo lịch thi đấu",
        details: `Đã tạo lịch thi đấu trận đấu: "${m.team1?.team_name || 'Đội 1'} VS ${m.team2?.team_name || 'Đội 2'}" (Vào lúc ${new Date(m.date).toLocaleString('vi-VN')} tại sân ${m.stadium}) trong mùa giải "${m.season_id?.season_name || 'Không rõ'}"`,
        createdAt: m.createdAt,
        updatedAt: m.createdAt,
      });
      await log.save();
    }
    console.log(`✅ Seeded ${matches.length} matches.`);

    console.log("🎉 Seeding historic activity logs completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding historic activity logs:", error);
  }
};
