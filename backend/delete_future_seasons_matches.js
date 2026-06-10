import mongoose from 'mongoose';
import Season from './src/models/Season.js';
import Match from './src/models/Match.js';
import MatchLineup from './src/models/MatchLineup.js';
import TeamResult from './src/models/TeamResult.js';
import PlayerResult from './src/models/PlayerResult.js';
import PlayerRanking from './src/models/PlayerRanking.js';
import Ranking from './src/models/Ranking.js';

async function deleteFutureSeasonsMatches() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/quan_ly_bong_da');
    console.log('Connected to MongoDB');
    
    const now = new Date();
    const futureSeasons = await Season.find({ start_date: { $gt: now } });
    
    console.log(`Found ${futureSeasons.length} future seasons.`);
    
    for (const season of futureSeasons) {
        console.log(`Processing season ${season._id} (starts ${season.start_date})`);
        
        const matchesInSeason = await Match.find({ season_id: season._id }, '_id');
        const matchIds = matchesInSeason.map(m => m._id);
        
        const deleteLineups = await MatchLineup.deleteMany({ match_id: { $in: matchIds } });
        console.log(`- Deleted ${deleteLineups.deletedCount} match lineups.`);

        // Delete all matches
        const deleteMatches = await Match.deleteMany({ season_id: season._id });
        console.log(`- Deleted ${deleteMatches.deletedCount} matches.`);
        
        // Delete all team results
        const deleteTeamResults = await TeamResult.deleteMany({ season_id: season._id });
        console.log(`- Deleted ${deleteTeamResults.deletedCount} team results.`);
        
        // Delete all player results
        const deletePlayerResults = await PlayerResult.deleteMany({ season_id: season._id });
        console.log(`- Deleted ${deletePlayerResults.deletedCount} player results.`);
        
        // Delete all player rankings
        const deletePlayerRankings = await PlayerRanking.deleteMany({ season_id: season._id });
        console.log(`- Deleted ${deletePlayerRankings.deletedCount} player rankings.`);
        
        // Delete all rankings
        const deleteRankings = await Ranking.deleteMany({ season_id: season._id });
        console.log(`- Deleted ${deleteRankings.deletedCount} team rankings.`);
    }

    console.log('Successfully deleted all match info for future seasons.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteFutureSeasonsMatches();
