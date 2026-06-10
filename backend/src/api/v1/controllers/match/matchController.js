// File: backend/src/api/v1/controllers/match/matchController.js

import Match from "../../../../models/Match.js";
import Season from "../../../../models/Season.js";
import Team from "../../../../models/Team.js";
import Player from "../../../../models/Player.js";
import Regulation from "../../../../models/Regulation.js";
import TeamResult from "../../../../models/TeamResult.js";
import Ranking from "../../../../models/Ranking.js";
import PlayerResult from "../../../../models/PlayerResult.js";
import PlayerRanking from "../../../../models/PlayerRanking.js";
import MatchLineup from "../../../../models/MatchLineup.js";

import {
  createMatchSchema,
  createManualMatchSchema,
  updateMatchSchema,
  MatchIdSchema,
} from "../../../../schemas/matchSchema.js";
import { TeamIdSchema } from "../../../../schemas/teamSchema.js";
import { SeasonIdSchema } from "../../../../schemas/seasonSchema.js";
import { successResponse } from "../../../../utils/responseFormat.js";
import { logActivity } from "../../../../utils/activityLogger.js";
import mongoose from "mongoose";

// Import các hàm helper từ các controller khác
import { updateTeamResultsForDateInternal } from "../team/team_resultsController.js";
import { calculateAndSaveTeamRankings } from "../team/rankingController.js";
import { updatePlayerResultsForDateInternal } from "../player/player_resultsController.js";
import { calculateAndSavePlayerRankings } from "../player/player_rankingsController.js";


// =================================================================
// HÀM CHẠY NGẦM ĐỂ TÍNH TOÁN LẠI DỮ LIỆU
// =================================================================
const recalculateSubsequentData = async (seasonId, matchDate, team1Id, team2Id, teamRegulationRules, allPlayerIdsInLineups) => {
    const backgroundSession = await mongoose.startSession();
    // backgroundSession.startTransaction();
    try {
        console.log(`[BACKGROUND JOB] Starting recalculation for subsequent dates after ${matchDate.toISOString()}`);

        // --- 1. TÍNH TOÁN LẠI KẾT QUẢ ĐỘI CHO CÁC NGÀY TƯƠNG LAI ---
        const subsequentTeamResultDatesTeam1 = await TeamResult.find({ team_id: team1Id, season_id: seasonId, date: { $gt: matchDate } }, null, { session: backgroundSession }).distinct('date');
        const subsequentTeamResultDatesTeam2 = await TeamResult.find({ team_id: team2Id, season_id: seasonId, date: { $gt: matchDate } }, null, { session: backgroundSession }).distinct('date');
        const allTeamSubsequentDates = [...new Set([...subsequentTeamResultDatesTeam1, ...subsequentTeamResultDatesTeam2])].sort((a,b) => new Date(a) - new Date(b));

        for (const dateStrToRecalculate of allTeamSubsequentDates) {
            const dateToRecalculate = new Date(dateStrToRecalculate);
            await updateTeamResultsForDateInternal(team1Id, seasonId, dateToRecalculate, teamRegulationRules, backgroundSession);
            await updateTeamResultsForDateInternal(team2Id, seasonId, dateToRecalculate, teamRegulationRules, backgroundSession);
        }

        // --- 2. TÍNH TOÁN LẠI XẾP HẠNG ĐỘI CHO CÁC NGÀY TƯƠNG LAI ---
        const distinctRankingDatesAfter = await Ranking.find({ season_id: seasonId, date: { $gt: matchDate } }, null, { session: backgroundSession }).distinct('date');
        const allDatesToRecalculateRanking = [...new Set([matchDate, ...distinctRankingDatesAfter])].sort((a,b) => new Date(a) - new Date(b));
        for (const dateToRecalculate of allDatesToRecalculateRanking) {
            await calculateAndSaveTeamRankings(seasonId, new Date(dateToRecalculate), backgroundSession);
        }
        
        // --- 3. TÍNH TOÁN LẠI KẾT QUẢ CẦU THỦ CHO CÁC NGÀY TƯƠNG LAI ---
        if (allPlayerIdsInLineups && allPlayerIdsInLineups.length > 0) {
            const playersToUpdate = await Player.find({ _id: { $in: allPlayerIdsInLineups.map(id => new mongoose.Types.ObjectId(id)) } }).session(backgroundSession);
            const subsequentPlayerResultDates = await PlayerResult.find({ player_id: { $in: playersToUpdate.map(p => p._id) }, season_id: seasonId, date: { $gt: matchDate }}, null, {session: backgroundSession}).distinct('date');
            for (const dateStrToRecalculate of subsequentPlayerResultDates.sort((a,b) => new Date(a) - new Date(b))) {
                for (const player of playersToUpdate) {
                    let playerTeamContextForSubsequent = player.team_id;
                    if (playerTeamContextForSubsequent) {
                        await updatePlayerResultsForDateInternal(player._id, playerTeamContextForSubsequent, seasonId, new Date(dateStrToRecalculate), backgroundSession);
                    }
                }
            }
        
            // --- 4. TÍNH TOÁN LẠI XẾP HẠNG CẦU THỦ CHO CÁC NGÀY TƯƠNG LAI ---
            const distinctPlayerRankingDatesAfter = await PlayerRanking.find({ season_id: seasonId, date: { $gt: matchDate } }, null, {session: backgroundSession}).distinct('date');
            const allDatesToRecalculatePlayerRanking = [...new Set([matchDate, ...distinctPlayerRankingDatesAfter])].sort((a,b) => new Date(a) - new Date(b));

            for (const dateToRecalculate of allDatesToRecalculatePlayerRanking) {
                await calculateAndSavePlayerRankings(seasonId, new Date(dateToRecalculate), backgroundSession); 
            }
        }

        // await backgroundSession.commitTransaction();
        console.log(`[BACKGROUND JOB] Recalculation completed successfully.`);
    } catch (error) {
        // await backgroundSession.abortTransaction();
        console.error(`[BACKGROUND JOB] Error during subsequent data recalculation:`, error);
    } finally {
        backgroundSession.endSession();
    }
}


// GET all matches
const getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find().populate("team1 team2 season_id");
    return successResponse(res, matches, "Fetched all matches successfully");
  } catch (error) {
    return next(error);
  }
};

// GET match by ID
const getMatchesById = async (req, res, next) => {
  try {
    const validationResult = MatchIdSchema.safeParse({ id: req.params.id });
    if (!validationResult.success) {
        const error = new Error(validationResult.error.errors[0].message);
        error.status = 400;
        return next(error);
    }
    const matchId = new mongoose.Types.ObjectId(validationResult.data.id);

    const match = await Match.findById(matchId).populate(
      "team1 team2 season_id goalDetails.player_id goalDetails.team_id"
    );
    if (!match) {
      return next(Object.assign(new Error("Không tìm thấy trận đấu."), { status: 404 }));
    }
    return successResponse(res, match, "Match found successfully");
  } catch (error) {
    return next(error);
  }
};

// CREATE match schedule
const createMatch = async (req, res, next) => {
    const parseResult = createMatchSchema.safeParse(req.body);
    if (!parseResult.success) {
        return next(Object.assign(new Error(parseResult.error.errors[0].message), { status: 400 }));
    }

    const { season_id, matchperday } = parseResult.data;
    const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const season = await Season.findById(season_id).session(session);
        if (!season) {
            throw Object.assign(new Error("Season not found"), { status: 404 });
        }

        const teamsInSeason = await Team.find({ season_id }).session(session);
        const numTeams = teamsInSeason.length;
        if (numTeams < 2) {
            throw Object.assign(new Error("Không đủ đội trong mùa giải để tạo lịch thi đấu."), { status: 400 });
        }

        // Fixed fetching Age Regulation to match with the seeder data or default frontend regulation names
        const ageRegulation = await Regulation.findOne({ 
            season_id: season_id, 
            $or: [
                { regulation_name: "Age Regulation" },
                { regulation_name: /Quy định/i }
            ]
        }).session(session);
        
        let minPlayersRequiredForTeam = 15; // default fallback if missing
        if (ageRegulation && ageRegulation.rules) {
            if (typeof ageRegulation.rules.minPlayersPerTeam === 'number') {
                minPlayersRequiredForTeam = ageRegulation.rules.minPlayersPerTeam;
            } else if (typeof ageRegulation.rules.so_cauthutoithieu === 'number') {
                minPlayersRequiredForTeam = ageRegulation.rules.so_cauthutoithieu;
            }
        }
        for (const team of teamsInSeason) {
            const playerCount = await Player.countDocuments({ team_id: team._id }).session(session);
            if (playerCount < minPlayersRequiredForTeam) {
                throw Object.assign(new Error(`Đội ${team.team_name} chưa đăng ký đủ số lượng cầu thủ tối thiểu (${minPlayersRequiredForTeam} cầu thủ).`), { status: 400 });
            }
        }
        
        const matchRegulation = await Regulation.findOne({ 
            season_id: season_id, 
            $or: [
                { regulation_name: "Match Rules" },
                { regulation_name: /Quy định/i }
            ]
        }).session(session);
        let actualMatchRounds = 2;
        if (matchRegulation && typeof matchRegulation.rules?.matchRounds === 'number' && matchRegulation.rules.matchRounds > 0) {
            actualMatchRounds = matchRegulation.rules.matchRounds;
        } else if (matchRegulation && typeof matchRegulation.rules?.so_vongdau === 'number' && matchRegulation.rules.so_vongdau > 0) {
            actualMatchRounds = matchRegulation.rules.so_vongdau;
        }

        // =========================================================================
        // PHẦN KIỂM TRA SỐ NGÀY TỐI THIỂU (ĐÁP ỨNG YÊU CẦU CỦA BẠN)
        // =========================================================================
        
        let totalMatchesToSchedule = 0;
        if (actualMatchRounds === 1) {
            totalMatchesToSchedule = numTeams * (numTeams - 1) / 2;
        } else {
            totalMatchesToSchedule = numTeams * (numTeams - 1);
        }
        
        const maxMatchesPerDayPossible = Math.floor(numTeams / 2);
        const effectiveMatchesPerDay = Math.min(matchperday, maxMatchesPerDayPossible);
        
        if (effectiveMatchesPerDay === 0) {
            throw Object.assign(new Error(`Không thể xếp lịch với ${numTeams} đội và ${matchperday} trận mỗi ngày.`), { status: 400 });
        }

        const daysRequired = Math.ceil(totalMatchesToSchedule / effectiveMatchesPerDay);

        const startDate = new Date(season.start_date);
        const endDate = new Date(season.end_date);
        const seasonDurationInDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        if (seasonDurationInDays < daysRequired) {
            throw Object.assign(new Error(`Mùa giải không đủ ngày để sắp lịch. Cần ít nhất ${daysRequired} ngày, nhưng mùa giải chỉ kéo dài ${seasonDurationInDays} ngày. Vui lòng kéo dài thời gian mùa giải.`), { status: 400 });
        }

        // =========================================================================
        // BẮT ĐẦU THUẬT TOÁN XẾP LỊCH CHI TIẾT
        // =========================================================================

        let matchesPool = [];
        for (let i = 0; i < teamsInSeason.length; i++) {
            for (let j = 0; j < teamsInSeason.length; j++) {
                if (i === j) continue;
                matchesPool.push({ team1: teamsInSeason[i], team2: teamsInSeason[j], stadium: teamsInSeason[i].stadium });
            }
        }
        
        if (actualMatchRounds === 1) {
            const uniquePairs = new Set();
            matchesPool = matchesPool.filter(match => {
                const sortedIds = [match.team1._id.toString(), match.team2._id.toString()].sort().join('-');
                if (uniquePairs.has(sortedIds)) return false;
                uniquePairs.add(sortedIds);
                return true;
            });
        }
        
        for (let i = matchesPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [matchesPool[i], matchesPool[j]] = [matchesPool[j], matchesPool[i]];
        }
        
        const schedule = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate && matchesPool.length > 0) {
            const teamsBusyToday = new Set();
            let matchesScheduledToday = 0;
            
            for (let i = matchesPool.length - 1; i >= 0; i--) {
                if(matchesScheduledToday >= matchperday) break;

                const match = matchesPool[i];
                const team1Id = match.team1._id.toString();
                const team2Id = match.team2._id.toString();

                if (!teamsBusyToday.has(team1Id) && !teamsBusyToday.has(team2Id)) {
                    schedule.push({
                        season_id,
                        team1: match.team1._id,
                        team2: match.team2._id,
                        date: new Date(currentDate),
                        stadium: match.stadium,
                        score: null,
                        goalDetails: [],
                    });
                    teamsBusyToday.add(team1Id);
                    teamsBusyToday.add(team2Id);
                    matchesScheduledToday++;
                    matchesPool.splice(i, 1);
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (schedule.length < totalMatchesToSchedule) {
             throw Object.assign(new Error(`Tạo lịch thất bại. Đã xếp được ${schedule.length}/${totalMatchesToSchedule} trận. Có thể do cài đặt 'Số trận mỗi ngày' quá thấp hoặc một lỗi không mong muốn.`), { status: 400 });
        }

        await Match.insertMany(schedule, { session });

        await logActivity(req, "Tạo lịch thi đấu", `Đã tạo tự động ${schedule.length} trận đấu cho mùa giải "${season.season_name}"`);

        // await session.commitTransaction();
        session.endSession();
        return successResponse(res, { schedule }, "Created schedule successfully", 201);
    } catch (error) {
        // if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        console.error("Error in createMatch:", error);
        return next(error);
    }
};

// CREATE a manual single match
const createManualMatch = async (req, res, next) => {
    const parseResult = createManualMatchSchema.safeParse(req.body);
    if (!parseResult.success) {
        return next(Object.assign(new Error(parseResult.error.errors[0].message), { status: 400 }));
    }

    const { season_id, team1_id, team2_id, date, stadium } = parseResult.data;

    if (team1_id === team2_id) {
        return next(Object.assign(new Error("Hai đội không thể giống nhau."), { status: 400 }));
    }

    try {
        const team1 = await Team.findById(team1_id);
        const team2 = await Team.findById(team2_id);

        if (!team1 || !team2) {
            return next(Object.assign(new Error("Không tìm thấy một trong hai đội bóng."), { status: 404 }));
        }

        if (team1.season_id.toString() !== season_id || team2.season_id.toString() !== season_id) {
            return next(Object.assign(new Error("Cả hai đội phải thuộc cùng giải đấu đã chọn."), { status: 400 }));
        }

        const matchDateTime = new Date(date);
        const newMatch = new Match({
            season_id,
            team1: team1_id,
            team2: team2_id,
            date: matchDateTime,
            stadium: stadium || "",
            status: "Sắp diễn ra",
            score: null,
            goalDetails: [],
        });
        const savedMatch = await newMatch.save();
        await logActivity(req, "Tạo trận đấu", `Đã tạo thủ công trận đấu giữa đội ${team1_id} và ${team2_id}`);
        return successResponse(res, savedMatch, "Created match successfully", 201);
    } catch (error) {
        return next(error);
    }
};


// GET matches by season
const getMatchesBySeasonId = async (req, res, next) => {
  const season_id_param = req.params.season_id;
  const { success, error } = SeasonIdSchema.safeParse({ id: season_id_param });
  if (!success) {
    return next(
      Object.assign(new Error(error.errors[0].message), { status: 400 })
    );
  }

  try {
    let SeasonId = new mongoose.Types.ObjectId(season_id_param);

    const matches = await Match.find({ season_id: SeasonId })
        .populate('team1', 'team_name logo')
        .populate('team2', 'team_name logo')
        .populate('goalDetails.player_id', 'name')
        .sort({ date: 1 });

    if (!matches || matches.length === 0) {
      return successResponse(res, [], "No matches found for this season");
    }

    return successResponse(res, matches, 'Fetched all matches by season ID successfully');
  } catch (error) {
    return next(error);
  }
};


// UPDATE match
const updateMatch = async (req, res, next) => {
  const parseResult = updateMatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    return next(Object.assign(new Error(parseResult.error.errors[0].message), { status: 400 }));
  }

  const session = await mongoose.startSession();
  // session.startTransaction(); // Bỏ qua transaction vì local MongoDB (standalone) không hỗ trợ

  try {
    const validationResult = MatchIdSchema.safeParse({ id: req.params.id });
    if (!validationResult.success) {
        throw Object.assign(new Error(validationResult.error.errors[0].message), { status: 400 });
    }
    const matchId = new mongoose.Types.ObjectId(validationResult.data.id);
    const match = await Match.findById(matchId).populate("team1 team2").session(session);

    if (!match) {
      throw Object.assign(new Error("Không tìm thấy trận đấu để cập nhật."), { status: 404 });
    }

    const updateFields = parseResult.data;
    const oldScore = match.score;

    const targetDate = updateFields.date ? new Date(updateFields.date) : new Date(match.date);
    if (targetDate > new Date()) {
        updateFields.score = null;
        updateFields.goalDetails = [];
    }

    const lineupTeam1 = await MatchLineup.findOne({ match_id: matchId, team_id: match.team1._id }).session(session);
    const lineupTeam2 = await MatchLineup.findOne({ match_id: matchId, team_id: match.team2._id }).session(session);
    const participatingPlayerIdsTeam1 = lineupTeam1 ? lineupTeam1.players.map(p => p.player_id.toString()) : [];
    const participatingPlayerIdsTeam2 = lineupTeam2 ? lineupTeam2.players.map(p => p.player_id.toString()) : [];
    
    if (updateFields.goalDetails && updateFields.score && /^\d+-\d+$/.test(updateFields.score)) {
        const goalRegulation = await Regulation.findOne({
          season_id: match.season_id._id,
          regulation_name: "Goal Rules",
        }).session(session);
        const maxTime = goalRegulation?.rules?.goalTimeLimit?.maxMinute;
        const allowedTypes = goalRegulation?.rules?.goalTypes || [];
  
        for (const goal of updateFields.goalDetails) {
          if(!mongoose.Types.ObjectId.isValid(goal.player_id) || !mongoose.Types.ObjectId.isValid(goal.team_id)) {
              if (!updateFields.force) throw Object.assign(new Error("Invalid player_id or team_id in goalDetails"), { status: 400 });
          }
          
          const playerDoc = await Player.findById(goal.player_id).session(session);
          if (!playerDoc) {
              if (!updateFields.force) throw Object.assign(new Error(`Player with ID ${goal.player_id} not found for a goal.`), { status: 400 });
              continue; // Bỏ qua nếu đang ép lưu
          }
  
          const actualPlayerTeamId = playerDoc.team_id;
          const beneficiaryTeamIdForGoal = new mongoose.Types.ObjectId(goal.team_id);
  
          const isPlayerInTeam1Participating = participatingPlayerIdsTeam1.includes(playerDoc._id.toString());
          const isPlayerInTeam2Participating = participatingPlayerIdsTeam2.includes(playerDoc._id.toString());
  
          if (!isPlayerInTeam1Participating && !isPlayerInTeam2Participating) {
              if (!updateFields.force) throw Object.assign(new Error(`Lỗi ghi bàn: Cầu thủ được chọn không có trong đội hình thi đấu của trận này.`), { status: 400 });
          }
  
          if (goal.goalType === "OG") { // Xử lý bàn phản lưới nhà
              if (beneficiaryTeamIdForGoal.equals(match.team1._id)) { // OG cho đội 1
                  if (!actualPlayerTeamId.equals(match.team2._id)) { // Người ghi bàn phải từ đội 2
                      if (!updateFields.force) throw Object.assign(new Error(`Lỗi bàn phản lưới nhà: Cầu thủ ghi bàn và đội hưởng lợi không hợp lệ.`), { status: 400 });
                  }
              } else if (beneficiaryTeamIdForGoal.equals(match.team2._id)) { // OG cho đội 2
                  if (!actualPlayerTeamId.equals(match.team1._id)) { // Người ghi bàn phải từ đội 1
                       if (!updateFields.force) throw Object.assign(new Error(`Lỗi bàn phản lưới nhà: Cầu thủ ghi bàn và đội hưởng lợi không hợp lệ.`), { status: 400 });
                  }
              } else {
                  if (!updateFields.force) throw Object.assign(new Error("Đội hưởng lợi bàn phản lưới nhà không hợp lệ."), { status: 400 });
              }
          } else { // Xử lý bàn thắng thường
              if (!actualPlayerTeamId.equals(beneficiaryTeamIdForGoal)) {
                  if (!updateFields.force) throw Object.assign(new Error(`Lỗi bàn thắng thường: Cầu thủ ${playerDoc.name} không thuộc đội hưởng lợi.`), { status: 400 });
              }
          }
  
          if (maxTime !== undefined && goal.minute > maxTime) {
            if (!updateFields.force) throw Object.assign(new Error("Phút ghi bàn vượt quá giới hạn của quy định."), { status: 400 });
          }
          if (allowedTypes.length > 0 && !allowedTypes.includes(goal.goalType)) {
            if (!updateFields.force) throw Object.assign(new Error(`Loại bàn thắng không hợp lệ: ${goal.goalType}. Các loại hợp lệ: ${allowedTypes.join(', ')}`), { status: 400 });
          }
        }
      } else if (updateFields.score === null || updateFields.score === '') {
          updateFields.goalDetails = [];
      }
    
    await Match.updateOne({ _id: matchId }, { $set: updateFields }, { session });
    
    const updatedMatchFull = await Match.findById(matchId).populate("team1 team2 season_id").session(session);

    await logActivity(req, "Cập nhật trận đấu", `Đã cập nhật kết quả/thành phần trận đấu: "${updatedMatchFull.team1?.team_name} VS ${updatedMatchFull.team2?.team_name}" (Kết quả: ${updatedMatchFull.score || 'chưa đá'})`);

    const newScore = updatedMatchFull.score;
    const isPlayed = (oldScore !== null && oldScore !== "") || (newScore !== null && newScore !== "");

    if (isPlayed) {
        const seasonId = updatedMatchFull.season_id._id;
        const oldMatchDate = new Date(match.date);
        oldMatchDate.setUTCHours(0, 0, 0, 0);
        const newMatchDate = new Date(updatedMatchFull.date);
        newMatchDate.setUTCHours(0, 0, 0, 0);
        const team1Id = updatedMatchFull.team1._id;
        const team2Id = updatedMatchFull.team2._id;

        const rankingRegulation = await Regulation.findOne({ season_id: seasonId, regulation_name: "Ranking Rules" }).session(session);
        if (!rankingRegulation || !rankingRegulation.rules) {
            throw Object.assign(new Error("Ranking Regulation not found for the season."), { status: 500 });
        }
        const teamRegulationRules = {
            winPoints: rankingRegulation.rules.winPoints || 3,
            drawPoints: rankingRegulation.rules.drawPoints || 1,
            losePoints: rankingRegulation.rules.losePoints || 0,
        };

        // Recalculate old date
        await updateTeamResultsForDateInternal(team1Id, seasonId, oldMatchDate, teamRegulationRules, session);
        await updateTeamResultsForDateInternal(team2Id, seasonId, oldMatchDate, teamRegulationRules, session);
        await calculateAndSaveTeamRankings(seasonId, oldMatchDate, session);

        // Recalculate new date (if date changed)
        const dateChanged = oldMatchDate.getTime() !== newMatchDate.getTime();
        if (dateChanged) {
            await updateTeamResultsForDateInternal(team1Id, seasonId, newMatchDate, teamRegulationRules, session);
            await updateTeamResultsForDateInternal(team2Id, seasonId, newMatchDate, teamRegulationRules, session);
            await calculateAndSaveTeamRankings(seasonId, newMatchDate, session);
        }

        // Fetch new lineups to include newly added or removed players
        const newLineupTeam1 = await MatchLineup.findOne({ match_id: matchId, team_id: match.team1._id }).session(session);
        const newLineupTeam2 = await MatchLineup.findOne({ match_id: matchId, team_id: match.team2._id }).session(session);
        const newPlayerIds1 = newLineupTeam1 ? newLineupTeam1.players.map(p => p.player_id.toString()) : [];
        const newPlayerIds2 = newLineupTeam2 ? newLineupTeam2.players.map(p => p.player_id.toString()) : [];

        const allPlayerIds = [...new Set([...participatingPlayerIdsTeam1, ...participatingPlayerIdsTeam2, ...newPlayerIds1, ...newPlayerIds2])];

        for (const playerIdStr of allPlayerIds) {
            const playerTeamContext = (participatingPlayerIdsTeam1.includes(playerIdStr) || newPlayerIds1.includes(playerIdStr)) ? team1Id : team2Id;
            await updatePlayerResultsForDateInternal(new mongoose.Types.ObjectId(playerIdStr), playerTeamContext, seasonId, oldMatchDate, session);
            if (dateChanged) {
                await updatePlayerResultsForDateInternal(new mongoose.Types.ObjectId(playerIdStr), playerTeamContext, seasonId, newMatchDate, session);
            }
        }
        await calculateAndSavePlayerRankings(seasonId, oldMatchDate, session);
        if (dateChanged) {
            await calculateAndSavePlayerRankings(seasonId, newMatchDate, session);
        }
    }

    // await session.commitTransaction();
    session.endSession();

    successResponse(res, updatedMatchFull, "Updated match successfully. Recalculating subsequent data in background.");

    if (isPlayed) {
        const seasonId = updatedMatchFull.season_id._id;
        const oldMatchDate = new Date(match.date);
        oldMatchDate.setUTCHours(0, 0, 0, 0);
        const newMatchDate = new Date(updatedMatchFull.date);
        newMatchDate.setUTCHours(0, 0, 0, 0);
        const team1Id = updatedMatchFull.team1._id;
        const team2Id = updatedMatchFull.team2._id;

        const rankingRegulation = await Regulation.findOne({ season_id: seasonId, regulation_name: "Ranking Rules" });
        const teamRegulationRules = { 
            winPoints: rankingRegulation?.rules?.winPoints || 3, 
            drawPoints: rankingRegulation?.rules?.drawPoints || 1, 
            losePoints: rankingRegulation?.rules?.losePoints || 0 
        };

        const newLineupTeam1 = await MatchLineup.findOne({ match_id: matchId, team_id: match.team1._id });
        const newLineupTeam2 = await MatchLineup.findOne({ match_id: matchId, team_id: match.team2._id });
        const newPlayerIds1 = newLineupTeam1 ? newLineupTeam1.players.map(p => p.player_id.toString()) : [];
        const newPlayerIds2 = newLineupTeam2 ? newLineupTeam2.players.map(p => p.player_id.toString()) : [];
        const allPlayerIds = [...new Set([...participatingPlayerIdsTeam1, ...participatingPlayerIdsTeam2, ...newPlayerIds1, ...newPlayerIds2])];

        const minDate = oldMatchDate < newMatchDate ? oldMatchDate : newMatchDate;
        recalculateSubsequentData(seasonId, minDate, team1Id, team2Id, teamRegulationRules, allPlayerIds);
    }

  } catch (error) {
    if (session.inTransaction()) {
        // await session.abortTransaction();
        session.endSession();
    }
    console.error("Error in updateMatch:", error);
    return next(error);
  }
};


// DELETE match - ĐÃ TỐI ƯU HÓA
const deleteMatch = async (req, res, next) => {
    const session = await mongoose.startSession();
    // session.startTransaction();
    try {
        const validationResult = MatchIdSchema.safeParse({ id: req.params.id });
        if (!validationResult.success) {
            throw Object.assign(new Error(validationResult.error.errors[0].message), { status: 400 });
        }
        const matchId = new mongoose.Types.ObjectId(validationResult.data.id);

        const matchToDelete = await Match.findById(matchId).populate("team1 team2").session(session);
        if (!matchToDelete) {
            throw Object.assign(new Error("Không tìm thấy trận đấu."), { status: 404 });
        }

        const { season_id: seasonId, team1: team1Id, team2: team2Id, date: matchDateRaw, score: deletedMatchScore } = matchToDelete;
        const wasScoredMatch = deletedMatchScore !== null && /^\d+-\d+$/.test(deletedMatchScore);

        const lineups = await MatchLineup.find({ match_id: matchId }).session(session);
        const allPlayerIdsInLineups = lineups.flatMap(l => l.players.map(p => p.player_id.toString()));

        await MatchLineup.deleteMany({ match_id: matchId }, { session });
        await Match.deleteOne({ _id: matchId }, { session });
        
        await logActivity(req, "Xóa trận đấu", `Đã xóa trận đấu: "${matchToDelete.team1?.team_name || 'Đội 1'} VS ${matchToDelete.team2?.team_name || 'Đội 2'}" khỏi lịch thi đấu`);

        // await session.commitTransaction();
        session.endSession();

        successResponse(res, null, "Deleted match successfully. Recalculation is running in background if needed.", 200);

        if (wasScoredMatch) {
            const matchDate = new Date(matchDateRaw);
            matchDate.setUTCHours(0,0,0,0);
            
            const rankingRegulation = await Regulation.findOne({ season_id: seasonId, regulation_name: "Ranking Rules" });
            if (!rankingRegulation) {
                console.error(`[BACKGROUND JOB] Cannot start recalculation after delete. Ranking regulation for season ${seasonId} not found.`);
                return;
            }
            const teamRegulationRules = { winPoints: rankingRegulation.rules.winPoints || 3, drawPoints: rankingRegulation.rules.drawPoints || 1, losePoints: rankingRegulation.rules.losePoints || 0 };
            
            await updateTeamResultsForDateInternal(team1Id, seasonId, matchDate, teamRegulationRules);
            await updateTeamResultsForDateInternal(team2Id, seasonId, matchDate, teamRegulationRules);

            recalculateSubsequentData(seasonId, matchDate, team1Id, team2Id, teamRegulationRules, allPlayerIdsInLineups);
        }

    } catch (error) {
        if (session.inTransaction()) {
            // await session.abortTransaction();
        }
        session.endSession();
        console.error("Error in deleteMatch:", error);
        return next(error);
    }
};

// GET matches by team
const getMatchesByTeamId = async (req, res, next) => {
  const team_id_param = req.params.team_id;
  const { success, error } = TeamIdSchema.safeParse({ id: team_id_param });
  if (!success) {
    return next(
      Object.assign(new Error(error.errors[0].message), { status: 400 })
    );
  }
  try {
    const TeamId = new mongoose.Types.ObjectId(team_id_param);
    const matches = await Match.find({
      $or: [{ team1: TeamId }, { team2: TeamId }],
    }).populate("team1 team2 season_id");
    if (!matches || matches.length === 0) {
      return successResponse(res, [], "No matches found for this team");
    }
    return successResponse(res, matches, "Match found successfully");
  } catch (error) {
    return next(error);
  }
};

// GET matches by season and date
const getMatchesBySeasonIdAndDate = async (req, res, next) => {
  const { season_id, date } = req.params;

  const { success, error } = SeasonIdSchema.safeParse({ id: season_id });
  if (!success) {
    return next(
      Object.assign(new Error(error.errors[0].message), { status: 400 })
    );
  }

  try {
    const SeasonId = new mongoose.Types.ObjectId(season_id);
    const matchDate = new Date(date);

    if (isNaN(matchDate.getTime())) {
      return next(
        Object.assign(new Error("Invalid date format"), { status: 400 })
      );
    }

    const startOfDay = new Date(matchDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(matchDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const matches = await Match.find({
      season_id: SeasonId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("team1 team2 season_id");

    if (!matches || matches.length === 0) {
      return successResponse(res, [], "No matches found for this season and date");
    }

    return successResponse(
      res,
      matches,
      "Fetched all matches by season ID and date successfully"
    );
  } catch (error) {
    return next(error);
  }
};

export {
  getMatches,
  getMatchesById,
  createMatch,
  createManualMatch,
  updateMatch,
  deleteMatch,
  getMatchesBySeasonId,
  getMatchesBySeasonIdAndDate,
  getMatchesByTeamId,
};