import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    season_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
      required: true,
    },
    team_name: {
      type: String,
      required: true,
    },
    stadium: {
      type: String,
      required: true,
    },
    coach: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    is_conflicting: { type: Boolean, default: false },
    conflict_reason: { type: String, default: '' },
  },
  { timestamps: true }
);

const Team = mongoose.model("Team", teamSchema);

export default Team;
