import express from "express";
import {
  getMatches,
  getMatchesById,
  createMatch,
  createManualMatch,
  updateMatch,
  deleteMatch,
  getMatchesBySeasonId,
  getMatchesBySeasonIdAndDate,
  getMatchesByTeamId,
} from "../../controllers/match/matchController.js";
import { authenticateToken, checkPermission } from "../../middleware/authMiddleware.js";
import { errorMiddleware } from "../../middleware/errorMiddleware.js";

const router = express.Router();

router.get("/", getMatches); ///
router.get("/:id", getMatchesById); ///
router.get("/seasons/:season_id/:date", getMatchesBySeasonIdAndDate); ///
router.post("/", authenticateToken, checkPermission("manage_matches"), createMatch); ///
router.post("/manual", authenticateToken, checkPermission("manage_matches"), createManualMatch);
router.get("/teams/:team_id", getMatchesByTeamId);
router.get("/seasons/:season_id", getMatchesBySeasonId); ///
router.put("/:id", authenticateToken, checkPermission("manage_matches"), updateMatch); ///
router.delete("/:id", authenticateToken, checkPermission("manage_matches"), deleteMatch); ///
router.use(errorMiddleware); // Đảm bảo mọi lỗi đều được xử lý bởi errorMiddleware

export default router;
