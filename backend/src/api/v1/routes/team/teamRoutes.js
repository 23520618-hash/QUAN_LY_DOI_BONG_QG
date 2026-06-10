import express from "express";
import {
  getTeams,
  getTeamsByID,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamsByIDSeason,
  getTeamsByNameAndSeasonId,
} from "../../controllers/team/teamController.js";
import { authenticateToken, checkPermission } from "../../middleware/authMiddleware.js";
import { errorMiddleware } from "../../middleware/errorMiddleware.js";

const router = express.Router();

router.get("/", getTeams); ///
router.post("/", authenticateToken, checkPermission("manage_teams"), createTeam); ///
router.put("/:id", authenticateToken, checkPermission("manage_teams"), updateTeam); ///
router.delete("/:id", authenticateToken, checkPermission("manage_teams"), deleteTeam); ///
router.get("/:id", getTeamsByID); ///
router.get("/seasons/:season_id", getTeamsByIDSeason); ///
router.get("/:season_id/:team_name", getTeamsByNameAndSeasonId); ///
router.use(errorMiddleware); // Đảm bảo mọi lỗi đều được xử lý bởi errorMiddleware

export default router;
