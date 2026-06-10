import mongoose from 'mongoose';
import Match from './src/models/Match.js';
import TeamResult from './src/models/TeamResult.js';
import PlayerResult from './src/models/PlayerResult.js';

async function wipeFutureScores() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/quan_ly_bong_da');
    console.log('Connected to MongoDB');

    const now = new Date();
    // Find future matches that have a score
    const futureMatches = await Match.find({ 
      date: { $gt: now },
      score: { $ne: null, $ne: "" }
    });

    console.log(`Found ${futureMatches.length} future matches with invalid scores.`);

    for (const match of futureMatches) {
      match.score = null;
      match.goalDetails = [];
      await match.save();
      console.log(`Wiped score for future match ${match._id}`);
      
      // We also need to wipe their TeamResult and PlayerResult for that date because they should not be counted
      await TeamResult.deleteMany({ season_id: match.season_id, date: { $gt: now } });
      await PlayerResult.deleteMany({ season_id: match.season_id, date: { $gt: now } });
    }

    console.log('Data wipe completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error wiping data:', error);
    process.exit(1);
  }
}

wipeFutureScores();
