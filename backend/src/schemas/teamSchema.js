import { z } from "zod";
import mongoose from "mongoose";

const CreateTeamSchema = z.object({
  season_id: z
    .string()
    .min(1, "Season ID is required")
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid season_id",
    }),
  team_name: z.string().min(1, "Team name is required"),
  stadium: z.string().min(1, "Stadium is required"),
  coach: z.string().optional(),
  logo: z.string().optional(),
});

const UpdateTeamSchema = z.object({
  team_name: z.string().min(1, "Team name is required").optional(),
  stadium: z.string().min(1, "Stadium is required").optional(),
  coach: z.string().optional(),
  logo: z.string().optional(),
});

const TeamIdSchema = z.object({
  id: z
    .string()
    .min(1, "Team ID is required")
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid team_id",
    }),
});

const NameTeamSchema = z.object({
  team_name: z.string().min(1, "Team name is required"),
});

export { CreateTeamSchema, UpdateTeamSchema, TeamIdSchema, NameTeamSchema };
