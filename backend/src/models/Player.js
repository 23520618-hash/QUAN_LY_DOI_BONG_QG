import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    nationality: { type: String, required: true },
    position: { type: String, default: '' },
    isForeigner: { type: Boolean, default: false },
    number: { type: String, default: '' },
    avatar: { type: String, default: '' },
    is_conflicting: { type: Boolean, default: false },
    conflict_reason: { type: String, default: '' },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema);

export default Player;