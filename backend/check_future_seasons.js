import mongoose from 'mongoose';
import Season from './src/models/Season.js';
import Match from './src/models/Match.js';

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/quan_ly_bong_da');
  const now = new Date();
  
  const seasons = await Season.find({ start_date: { $gt: now } });
  console.log(`Found ${seasons.length} future seasons:`);
  for (const s of seasons) {
      console.log(`- ${s.name} (starts ${s.start_date})`);
      const matches = await Match.find({ season_id: s._id });
      console.log(`  -> has ${matches.length} matches`);
  }
  
  const futureMatches = await Match.find({ date: { $gt: now } });
  console.log(`Total future matches across all seasons: ${futureMatches.length}`);
  
  process.exit(0);
}
check();
