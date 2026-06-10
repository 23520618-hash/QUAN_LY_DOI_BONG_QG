import Regulation from "../../../../models/Regulation.js";
import { successResponse } from "../../../../utils/responseFormat.js";
import { logActivity } from "../../../../utils/activityLogger.js";
import {
  CreateRegulationSchema,
  UpdateRegulationSchema,
  RegulationIdSchema,
  GetIdRegulationsSchema,
  VALID_REGULATIONS,
} from "../../../../schemas/regulationSchema.js";
import { SeasonIdSchema } from "../../../../schemas/seasonSchema.js";
import mongoose from "mongoose";
import Player from "../../../../models/Player.js";
import Team from "../../../../models/Team.js";

// Kiểm tra logic dữ liệu
const validateRules = (regulation_name, rules) => {
  switch (regulation_name) {
    case "Age Regulation":
      if (
        typeof rules.minAge !== "number" ||
        typeof rules.maxAge !== "number" ||
        rules.minAge >= rules.maxAge ||
        typeof rules.minPlayersPerTeam !== "number" ||
        typeof rules.maxPlayersPerTeam !== "number" ||
        rules.minPlayersPerTeam > rules.maxPlayersPerTeam ||
        typeof rules.maxForeignPlayers !== "number"
      )
        return false;
      break;

    case "Match Rules":
      if (
        typeof rules.matchRounds !== "number" ||
        typeof rules.homeTeamRule !== "string"
      )
        return false;
      break;

    case "Goal Rules":
      if (
        !Array.isArray(rules.goalTypes) ||
        typeof rules.goalTimeLimit !== "object" ||
        typeof rules.goalTimeLimit.minMinute !== "number" ||
        typeof rules.goalTimeLimit.maxMinute !== "number"
      )
        return false;
      break;

    case "Ranking Rules":
      if (
        typeof rules.winPoints !== "number" ||
        typeof rules.drawPoints !== "number" ||
        typeof rules.losePoints !== "number" ||
        rules.winPoints <= rules.drawPoints ||
        rules.drawPoints <= rules.losePoints ||
        !Array.isArray(rules.rankingCriteria)
      )
        return false;
      break;

    default:
      return false;
  }
  return true;
};

const getRegulationsBySeasonId = async (req, res, next) => {
  const { season_id } = req.params;
  try {
    console.log(`Tìm quy định với season_id: ${season_id}`); // Debug log
    const { success, error } = SeasonIdSchema.safeParse({ id: season_id });
    if (!success) {
      const validationError = new Error(`ID mùa giải không hợp lệ: ${error.errors[0].message}`);
      validationError.status = 400;
      return next(validationError);
    }
    const regulations = await Regulation.find({ season_id: new mongoose.Types.ObjectId(season_id) });
    return successResponse(
      res,
      regulations,
      "Lấy quy định theo mùa giải thành công"
    );
  } catch (error) {
    console.error(`Lỗi trong getRegulationsBySeasonId: ${error.message}`); // Debug log
    return next(error);
  }
};

// API tạo quy định
const createRegulation = async (req, res, next) => {
  const { season_id, regulation_name, rules } = req.body;
  try {
    // Validate schema với Zod
    const { success, error } = CreateRegulationSchema.safeParse({
      season_id,
      regulation_name,
      rules,
    });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    // Kiểm tra đủ các trường trong rules
    const requiredFields = VALID_REGULATIONS[regulation_name];
    for (let field of requiredFields) {
      if (!(field in rules)) {
        const error = new Error(`Bạn chưa nhập đủ thông tin cho quy định. Thiếu trường: ${field}.`);
        error.status = 400;
        return next(error);
      }
    }

    // Kiểm tra logic dữ liệu
    if (!validateRules(regulation_name, rules)) {
      const error = new Error("Các giá trị bạn nhập cho quy định không hợp lệ (ví dụ: tuổi tối thiểu lớn hơn tuổi tối đa).");
      error.status = 400;
      return next(error);
    }

    const existingRegulation = await Regulation.findOne({
      season_id,
      regulation_name,
    });
    if (existingRegulation) {
      const error = new Error("Đã tồn tại quy định với tên này trong mùa giải này.");
      error.status = 400;
      return next(error);
    }

    const newRegulation = new Regulation({
      season_id: new mongoose.Types.ObjectId(season_id),
      regulation_name,
      rules,
    });
    await newRegulation.save();

    await logActivity(req, "Thay đổi quy định", `Đã tạo quy định mới "${regulation_name}"`);

    return successResponse(res, null, "Regulation created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

// API lấy danh sách quy định
const getRegulations = async (req, res, next) => {
  try {
    const regulations = await Regulation.find();
    return successResponse(
      res,
      regulations,
      "Fetched regulations successfully"
    );
  } catch (error) {
    return next(error);
  }
};

// API lấy quy định theo id
const getRegulationById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { success, error } = RegulationIdSchema.safeParse({ id });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const regulation = await Regulation.findById(id);
    if (!regulation) {
      const error = new Error("Không tìm thấy quy định được yêu cầu.");
      error.status = 404;
      return next(error);
    }
    return successResponse(res, regulation, "Regulation found successfully");
  } catch (error) {
    return next(error);
  }
};

// API cập nhật quy định
const updateRegulation = async (req, res, next) => {
  const { season_id, regulation_name, rules, force } = req.body;
  const { id } = req.params;
  try {
    const { success: idSuccess, error: idError } = RegulationIdSchema.safeParse(
      { id }
    );
    if (!idSuccess) {
      const validationError = new Error(idError.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const { success, error } = UpdateRegulationSchema.safeParse({
      season_id,
      regulation_name,
      rules,
      force,
    });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const regulation = await Regulation.findById(id);
    if (!regulation) {
      const error = new Error("Không tìm thấy quy định được yêu cầu.");
      error.status = 404;
      return next(error);
    }

    const newSeasonId = season_id || regulation.season_id.toString();
    const newRegName = regulation_name || regulation.regulation_name;

    // Kiểm tra trùng lặp nếu có thay đổi mùa giải hoặc tên quy định
    if (newSeasonId !== regulation.season_id.toString() || newRegName !== regulation.regulation_name) {
      const duplicate = await Regulation.findOne({
        season_id: new mongoose.Types.ObjectId(newSeasonId),
        regulation_name: newRegName,
        _id: { $ne: id },
      });
      if (duplicate) {
        const error = new Error("Đã tồn tại quy định với tên này trong mùa giải này.");
        error.status = 400;
        return next(error);
      }
    }

    // Kiểm tra logic dữ liệu
    if (!validateRules(newRegName, rules)) {
      const error = new Error("Các giá trị bạn nhập cho quy định không hợp lệ (ví dụ: tuổi tối thiểu lớn hơn tuổi tối đa).");
      error.status = 400;
      return next(error);
    }

    // Conflict Check
    let conflicts = [];
    if (newRegName === "Age Regulation") {
        const seasonId = newSeasonId;
        const teams = await Team.find({ season_id: seasonId });
        const teamIds = teams.map(t => t._id);
        const players = await Player.find({ team_id: { $in: teamIds } });

        // Check age constraints
        if (rules.minAge !== undefined || rules.maxAge !== undefined) {
            const minA = rules.minAge;
            const maxA = rules.maxAge;
            for (let player of players) {
                const age = new Date().getFullYear() - new Date(player.dob).getFullYear();
                if (age < minA || age > maxA) {
                    conflicts.push({ type: 'player', id: player._id, reason: `Tuổi cầu thủ ${player.name} (${age}) vi phạm quy định [${minA}-${maxA}]` });
                }
            }
        }
        
        // Check foreign constraints
        if (rules.maxForeignPlayers !== undefined) {
            for (let team of teams) {
                const teamPlayers = players.filter(p => p.team_id.toString() === team._id.toString());
                const foreignCount = teamPlayers.filter(p => p.isForeigner).length;
                if (foreignCount > rules.maxForeignPlayers) {
                    conflicts.push({ type: 'team', id: team._id, reason: `Đội ${team.team_name} có ${foreignCount} ngoại binh (tối đa ${rules.maxForeignPlayers})` });
                }
            }
        }

        // Check squad size constraints
        if (rules.minPlayersPerTeam !== undefined || rules.maxPlayersPerTeam !== undefined) {
            for (let team of teams) {
                const teamPlayers = players.filter(p => p.team_id.toString() === team._id.toString());
                if (teamPlayers.length < rules.minPlayersPerTeam || teamPlayers.length > rules.maxPlayersPerTeam) {
                    conflicts.push({ type: 'team', id: team._id, reason: `Đội ${team.team_name} có ${teamPlayers.length} cầu thủ (quy định ${rules.minPlayersPerTeam}-${rules.maxPlayersPerTeam})` });
                }
            }
        }
    }
    
    if (conflicts.length > 0 && !force) {
        return res.status(409).json({
            status: 'conflict',
            message: 'Quy định mới gây xung đột với dữ liệu hiện tại.',
            data: conflicts
        });
    }
    
    // Save regulation
    const updateFields = { rules };
    if (season_id) updateFields.season_id = new mongoose.Types.ObjectId(season_id);
    if (regulation_name) updateFields.regulation_name = regulation_name;
    await Regulation.updateOne({ _id: id }, { $set: updateFields });
    
    if (force && conflicts.length > 0) {
        // Mark as conflicting
        const conflictingPlayerIds = conflicts.filter(c => c.type === 'player').map(c => c.id);
        const conflictingTeamIds = conflicts.filter(c => c.type === 'team').map(c => c.id);
        
        if (conflictingPlayerIds.length > 0) {
            for (let c of conflicts.filter(c => c.type === 'player')) {
                await Player.updateOne({ _id: c.id }, { $set: { is_conflicting: true, conflict_reason: c.reason } });
            }
        }
        if (conflictingTeamIds.length > 0) {
            for (let c of conflicts.filter(c => c.type === 'team')) {
                await Team.updateOne({ _id: c.id }, { $set: { is_conflicting: true, conflict_reason: c.reason } });
            }
        }
    }

    await logActivity(req, "Thay đổi quy định", `Đã cập nhật quy định "${regulation.regulation_name}"`);

    return successResponse(res, null, "Regulation updated successfully");
  } catch (error) {
    return next(error);
  }
};

// API xóa quy định
const deleteRegulation = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { success, error } = RegulationIdSchema.safeParse({ id });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const regulation = await Regulation.findById(id);
    if (!regulation) {
      const error = new Error("Không tìm thấy quy định được yêu cầu.");
      error.status = 404;
      return next(error);
    }

    await Regulation.deleteOne({ _id: id });
    
    await logActivity(req, "Thay đổi quy định", `Đã xóa quy định "${regulation.regulation_name}"`);

    return successResponse(res, null, "Regulation deleted successfully");
  } catch (error) {
    return next(error);
  }
};

// API lấy id quy định
const getIdRegulations = async (req, res, next) => {
  const { season_id, regulation_name } = req.params;
  try {
    const { success, error } = GetIdRegulationsSchema.safeParse({
      season_id,
      regulation_name,
    });
    if (!success) {
      const validationError = new Error(error.errors[0].message);
      validationError.status = 400;
      return next(validationError);
    }

    const Season_Id = new mongoose.Types.ObjectId(season_id);
    const regulation = await Regulation.findOne({
      season_id: Season_Id,
      regulation_name,
    });
    if (!regulation) {
      const error = new Error("Không tìm thấy quy định được yêu cầu.");
      error.status = 404;
      return next(error);
    }
    return successResponse(res, regulation._id, "Regulation id found");
  } catch (error) {
    return next(error);
  }
};

export {
  createRegulation,
  getRegulations,
  getRegulationById,
  updateRegulation,
  deleteRegulation,
  getIdRegulations,
  getRegulationsBySeasonId,
};
