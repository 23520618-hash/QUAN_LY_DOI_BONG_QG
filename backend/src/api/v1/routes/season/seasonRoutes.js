import express from "express";
import {
  getSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
  getSeasonById,
  getSeasonIdBySeasonName,
} from "../../controllers/season/seasonController.js";
import { authenticateToken, checkPermission } from "../../middleware/authMiddleware.js";
import { errorMiddleware } from "../../middleware/errorMiddleware.js";

const router = express.Router();
router.get("/:id", getSeasonById); ///
router.get("/", getSeasons); ///
router.get("/name/:season_name", getSeasonIdBySeasonName); ///
router.post("/", authenticateToken, checkPermission("manage_seasons"), createSeason); ////
router.put("/:id", authenticateToken, checkPermission("manage_seasons"), updateSeason); ///
router.delete("/:id", authenticateToken, checkPermission("manage_seasons"), deleteSeason); ///
router.use(errorMiddleware); // Đảm bảo mọi lỗi đều được xử lý bởi errorMiddleware

export default router;
