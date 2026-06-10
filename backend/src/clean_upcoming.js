import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Season from './models/Season.js';
import Match from './models/Match.js';
import MatchLineup from './models/MatchLineup.js';
import Ranking from './models/Ranking.js';
import PlayerRanking from './models/PlayerRanking.js';
import TeamResult from './models/TeamResult.js';
import PlayerResult from './models/PlayerResult.js';

dotenv.config();

const cleanUpcoming = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const now = new Date();
        const upcomingSeasons = await Season.find({ start_date: { $gt: now } });
        console.log(`Found ${upcomingSeasons.length} upcoming seasons`);

        for (const season of upcomingSeasons) {
            console.log(`Cleaning season: ${season.season_name}`);
            const seasonId = season._id;

            // Delete MatchLineups related to matches of this season
            const matches = await Match.find({ season_id: seasonId });
            const matchIds = matches.map(m => m._id);
            if (matchIds.length > 0) {
                await MatchLineup.deleteMany({ match_id: { $in: matchIds } });
            }

            // Delete Matches
            await Match.deleteMany({ season_id: seasonId });

            // Delete Rankings
            await Ranking.deleteMany({ season_id: seasonId });
            await PlayerRanking.deleteMany({ season_id: seasonId });

            // Delete Results
            await TeamResult.deleteMany({ season_id: seasonId });
            await PlayerResult.deleteMany({ season_id: seasonId });

            console.log(`Successfully cleaned season: ${season.season_name}`);
        }

        console.log('Cleaning completed.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

cleanUpcoming();
