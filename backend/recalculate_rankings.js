import mongoose from 'mongoose';
import { calculateAndSaveTeamRankings } from './src/api/v1/controllers/team/rankingController.js';
import Match from './src/models/Match.js';

async function recalculate() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/quan_ly_bong_da');
    console.log('Connected to MongoDB');

    const matches = await Match.find().distinct('season_id');
    const now = new Date();
    
    for (const seasonId of matches) {
        await calculateAndSaveTeamRankings(seasonId, now, null);
        console.log(`Recalculated rankings for season ${seasonId}`);
    }

    console.log('Recalculation completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error recalculating:', error);
    process.exit(1);
  }
}

recalculate();
