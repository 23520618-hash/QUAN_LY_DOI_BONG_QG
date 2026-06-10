import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/api/config/db.js';

import User from '../src/models/User.js';
import Season from '../src/models/Season.js';
import Regulation from '../src/models/Regulation.js';
import Team from '../src/models/Team.js';
import Player from '../src/models/Player.js';
import Match from '../src/models/Match.js';
import MatchLineup from '../src/models/MatchLineup.js';
import TeamResult from '../src/models/TeamResult.js';
import PlayerResult from '../src/models/PlayerResult.js';
import Ranking from '../src/models/Ranking.js';
import PlayerRanking from '../src/models/PlayerRanking.js';

dotenv.config();

const leaguesData = [
  {
    season_name: 'V-League 2025 (Đã kết thúc)',
    start_date: '2025-02-01',
    end_date: '2025-11-30',
    nationality: 'Việt Nam',
    teams: [
      { team_name: 'Hà Nội FC', stadium: 'Hàng Đẫy', coach: 'Daiki Iwamasa', logo: 'hanoi.png' },
      { team_name: 'CAHN FC', stadium: 'Hàng Đẫy', coach: 'Kiatisuk', logo: 'cahn.png' },
      { team_name: 'Thể Công Viettel', stadium: 'Mỹ Đình', coach: 'Nguyễn Đức Thắng', logo: 'viettel.png' },
      { team_name: 'Nam Định', stadium: 'Thiên Trường', coach: 'Vũ Hồng Việt', logo: 'namdinh.png' }
    ]
  },
  {
    season_name: 'V-League 2026 (Đang diễn ra)',
    start_date: '2026-02-01',
    end_date: '2026-11-30',
    nationality: 'Việt Nam',
    teams: [
      { team_name: 'Hà Nội FC', stadium: 'Hàng Đẫy', coach: 'Daiki Iwamasa', logo: 'hanoi.png' },
      { team_name: 'Hoàng Anh Gia Lai', stadium: 'Pleiku', coach: 'Vũ Tiến Thành', logo: 'hagl.png' },
      { team_name: 'Sông Lam Nghệ An', stadium: 'Vinh', coach: 'Phan Như Thuật', logo: 'slna.png' },
      { team_name: 'Thanh Hóa', stadium: 'Thanh Hóa', coach: 'Velizar Popov', logo: 'thanhhoa.png' }
    ]
  },
  {
    season_name: 'V-League 2027 (Sắp khởi tranh)',
    start_date: '2027-02-01',
    end_date: '2027-11-30',
    nationality: 'Việt Nam',
    teams: [
      { team_name: 'Hà Nội FC', stadium: 'Hàng Đẫy', coach: 'Daiki Iwamasa', logo: 'hanoi.png' },
      { team_name: 'Nam Định', stadium: 'Thiên Trường', coach: 'Vũ Hồng Việt', logo: 'namdinh.png' },
      { team_name: 'Hải Phòng FC', stadium: 'Lạch Tray', coach: 'Chu Đình Nghiêm', logo: 'haiphong.png' },
      { team_name: 'Bình Dương', stadium: 'Gò Đậu', coach: 'Lê Huỳnh Đức', logo: 'binhduong.png' }
    ]
  },
  {
    season_name: 'Premier League 2025/2026',
    start_date: '2025-08-15',
    end_date: '2026-05-25',
    nationality: 'Anh',
    teams: [
      { team_name: 'Manchester City', stadium: 'Etihad', coach: 'Pep Guardiola', logo: 'mancity.png' },
      { team_name: 'Arsenal', stadium: 'Emirates', coach: 'Mikel Arteta', logo: 'arsenal.png' },
      { team_name: 'Liverpool', stadium: 'Anfield', coach: 'Arne Slot', logo: 'liverpool.png' },
      { team_name: 'Manchester United', stadium: 'Old Trafford', coach: 'Erik ten Hag', logo: 'manutd.png' }
    ]
  },
  {
    season_name: 'Serie A 2025/2026',
    start_date: '2025-08-20',
    end_date: '2026-05-26',
    nationality: 'Ý',
    teams: [
      { team_name: 'Juventus', stadium: 'Allianz', coach: 'Thiago Motta', logo: 'juventus.png' },
      { team_name: 'AC Milan', stadium: 'San Siro', coach: 'Paulo Fonseca', logo: 'acmilan.png' },
      { team_name: 'Inter Milan', stadium: 'San Siro', coach: 'Simone Inzaghi', logo: 'inter.png' },
      { team_name: 'Napoli', stadium: 'Maradona', coach: 'Antonio Conte', logo: 'napoli.png' }
    ]
  },
  {
     season_name: 'La Liga 2026/2027 (Giải Tương lai)',
     start_date: '2026-08-15',
     end_date: '2027-05-25',
     nationality: 'Tây Ban Nha',
     teams: [
       { team_name: 'Real Madrid', stadium: 'Bernabéu', coach: 'Carlo Ancelotti', logo: 'realmadrid.png' },
       { team_name: 'Barcelona', stadium: 'Camp Nou', coach: 'Hansi Flick', logo: 'barcelona.png' },
       { team_name: 'Atletico Madrid', stadium: 'Metropolitano', coach: 'Diego Simeone', logo: 'atletico.png' },
       { team_name: 'Girona', stadium: 'Montilivi', coach: 'Michel', logo: 'girona.png' }
     ]
  },
  {
     season_name: 'UEFA Champions League 2025/2026',
     start_date: '2025-09-10',
     end_date: '2026-05-30',
     nationality: 'Châu Âu',
     teams: [
       { team_name: 'Real Madrid', stadium: 'Bernabéu', coach: 'Carlo Ancelotti', logo: 'realmadrid.png' },
       { team_name: 'Manchester City', stadium: 'Etihad', coach: 'Pep Guardiola', logo: 'mancity.png' },
       { team_name: 'Bayern Munich', stadium: 'Allianz Arena', coach: 'Vincent Kompany', logo: 'bayern.png' },
       { team_name: 'Paris Saint-Germain', stadium: 'Parc des Princes', coach: 'Luis Enrique', logo: 'psg.png' }
     ]
  },
  {
     season_name: 'FIFA World Cup 2026 (Giải Tương lai)',
     start_date: '2026-06-11',
     end_date: '2026-07-19',
     nationality: 'Quốc tế',
     teams: [
       { team_name: 'Argentina', stadium: 'Azteca', coach: 'Lionel Scaloni', logo: 'argentina.png' },
       { team_name: 'Pháp', stadium: 'MetLife', coach: 'Didier Deschamps', logo: 'france.png' },
       { team_name: 'Brazil', stadium: 'SoFi', coach: 'Dorival Júnior', logo: 'brazil.png' },
       { team_name: 'Anh', stadium: 'BC Place', coach: 'Thomas Tuchel', logo: 'england.png' }
     ]
  }
];

const generateRandomScore = () => {
    const goals1 = Math.floor(Math.random() * 4);
    const goals2 = Math.floor(Math.random() * 4);
    return { goals1, goals2, score: goals1 + '-' + goals2 };
};

const seedDB = async () => {
  try {
    await connectDB();
    console.log('🔄 Đang xóa toàn bộ dữ liệu hiện tại...');
    
    await User.deleteMany({});
    await Season.deleteMany({});
    await Regulation.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    await Match.deleteMany({});
    await MatchLineup.deleteMany({});
    await TeamResult.deleteMany({});
    await PlayerResult.deleteMany({});
    await Ranking.deleteMany({});
    await PlayerRanking.deleteMany({});

    console.log('✅ Đã dọn dẹp sạch sẽ kho dữ liệu.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await User.create({ username: 'Admin Liên Đoàn', email: 'admin@gmail.com', password: hashedPassword, userpassword: 'admin123' });

    let globalMatchCount = 0;
    
    for (const league of leaguesData) {
      console.log('\n======================================================');
      console.log('🏆 KHỞI TẠO SIÊU DỮ LIỆU: ' + league.season_name);
      console.log('======================================================');

      let seasonStatus = false;
       const today = new Date();
      const normalizedToday = new Date();
      normalizedToday.setUTCHours(0, 0, 0, 0);
      if (new Date(league.start_date) <= today && new Date(league.end_date) >= today) seasonStatus = true;

      const season = await Season.create({
        season_name: league.season_name,
        start_date: new Date(league.start_date),
        end_date: new Date(league.end_date),
        status: seasonStatus
      });

      await Regulation.create({
        regulation_name: 'Age Regulation',
        season_id: season._id,
        rules: { minAge: 16, maxAge: 45, minPlayersPerTeam: 15, maxPlayersPerTeam: 35, maxForeignPlayers: 6 }
      });
      await Regulation.create({
        regulation_name: 'Match Rules',
        season_id: season._id,
        rules: { matchRounds: 2, homeTeamRule: 'Sân nhà của đội 1' }
      });
      await Regulation.create({
        regulation_name: 'Goal Rules',
        season_id: season._id,
        rules: { goalTypes: ['normal', 'penalty', 'OG'], goalTimeLimit: { minMinute: 1, maxMinute: 90 } }
      });
      await Regulation.create({
        regulation_name: 'Ranking Rules',
        season_id: season._id,
        rules: { winPoints: 3, drawPoints: 1, losePoints: 0, rankingCriteria: ['points', 'goalsDifference', 'goalsFor'] }
      });

      const teams = await Team.insertMany(league.teams.map(team => ({ ...team, season_id: season._id })));

      const allSeasonPlayers = [];
      const cachedPlayerResultsList = [];
      const positions = ['Tiền đạo', 'Tiền vệ', 'Hậu vệ', 'Thủ môn', 'Tiền vệ', 'Hậu vệ']; 
      
      for (const team of teams) {
          const teamPlayersList = [];
          for(let i = 1; i <= 20; i++) {
              let pos = positions[Math.floor(Math.random() * positions.length)];
              if (i === 1 || i === 13) pos = 'Thủ môn';

              teamPlayersList.push({
                  name: (league.nationality === 'Việt Nam' ? 'Nguyễn Văn' : 'Siêu sao') + ' ' + i + ' - ' + team.team_name,
                  dob: new Date(1990 + (i % 15), (i % 12) + 1, (i % 28) + 1),
                  position: pos, nationality: (i % 4 === 0) ? 'Brazil' : league.nationality, 
                  team_id: team._id, number: i === 1 ? 1 : i + Math.floor(Math.random() * 70) + 2,
                  goals: 0, assists: 0, yellow_cards: 0, red_cards: 0
              });
          }
          const insertedPlayers = await Player.insertMany(teamPlayersList);
          allSeasonPlayers.push(...insertedPlayers);

          await TeamResult.create({ team_id: team._id, season_id: season._id, matchplayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalsDifference: 0, points: 0, date: normalizedToday });

          insertedPlayers.forEach(p => {
              cachedPlayerResultsList.push({ season_id: season._id, player_id: p._id, team_id: team._id, matchesplayed: 0, totalGoals: 0, assists: 0, yellowCards: 0, redCards: 0, date: normalizedToday });
          });
      }
      
      const insertedPlayerResults = await PlayerResult.insertMany(cachedPlayerResultsList);
      let playerStatsMap = {};
      insertedPlayerResults.forEach(pr => playerStatsMap[pr.player_id.toString()] = pr);

      const cachedTeamResults = await TeamResult.find({ season_id: season._id });
      
      // Tính toán khoảng thời gian xếp lịch cho trận đấu Vòng tròn 2 lượt (Sân nhà / Sân khách)
      const totalMatches = teams.length * (teams.length - 1);
      const timeSpanMs = new Date(league.end_date).getTime() - new Date(league.start_date).getTime();
      const intervalMs = timeSpanMs / (totalMatches + 1);
      
      let matchDateCursor = new Date(new Date(league.start_date).getTime() + intervalMs);

      let pastMatchesSimulated = 0;
      let upcomingMatchesScheduled = 0;

      if (true) {
          for (let i = 0; i < teams.length; i++) {
              for (let j = 0; j < teams.length; j++) {
                  if (i === j) continue; // Không đá với chính mình

                  const team1 = teams[i]; // Đội nhà
                  const team2 = teams[j]; // Đội khách

                  // Các giải đấu còn lại thì bổ sung đầy đủ hết tất cả dữ liệu (isPlayed = true)
                  const isPlayed = true; 

                  if (isPlayed) {
                      // MÔ PHỎNG TRẬN ĐÃ ĐÁ KÈM KẾT QUẢ VÀ LINEUP
                      const t1Players = allSeasonPlayers.filter(p => p.team_id.toString() === team1._id.toString());
                      const t2Players = allSeasonPlayers.filter(p => p.team_id.toString() === team2._id.toString());
                      
                      const r = generateRandomScore();
                      const goalDetails = [];

                      // Đội hình xuất phát & cập nhật số lần ra sân
                      const updateLineupStats = (plist) => {
                         let lineup = [];
                         plist.forEach((p, idx) => {
                            let pos = idx < 11 ? p.position : 'Dự bị';
                            lineup.push({ player_id: p._id, position: pos, jersey_number: p.number.toString() });
                            if(idx < 14) { 
                                playerStatsMap[p._id.toString()].matchesplayed += 1;
                                if(Math.random() < 0.1) playerStatsMap[p._id.toString()].yellowCards += 1; 
                            }
                         });
                         return lineup;
                      };

                      // Ghi bàn đọi 1
                      for (let k = 0; k < r.goals1; k++) {
                          const scorer = t1Players[Math.floor(Math.random() * 11)]; 
                          goalDetails.push({ player_id: scorer._id, team_id: team1._id, minute: Math.floor(Math.random() * 90) + 1, goalType: 'normal' });
                          playerStatsMap[scorer._id.toString()].totalGoals += 1;
                          if(Math.random() > 0.4) {
                              const assister = t1Players[Math.floor(Math.random() * 11)];
                              if(assister._id.toString() !== scorer._id.toString()) playerStatsMap[assister._id.toString()].assists += 1;
                          }
                      }
                      // Ghi bàn đội 2
                      for (let k = 0; k < r.goals2; k++) {
                          const scorer = t2Players[Math.floor(Math.random() * 11)];
                          goalDetails.push({ player_id: scorer._id, team_id: team2._id, minute: Math.floor(Math.random() * 90) + 1, goalType: 'normal' });
                          playerStatsMap[scorer._id.toString()].totalGoals += 1;
                          if(Math.random() > 0.4) {
                              const assister = t2Players[Math.floor(Math.random() * 11)];
                              if(assister._id.toString() !== scorer._id.toString()) playerStatsMap[assister._id.toString()].assists += 1;
                          }
                      }

                      const match = await Match.create({ season_id: season._id, team1: team1._id, team2: team2._id, date: new Date(matchDateCursor), stadium: team1.stadium, score: r.score, goalDetails: goalDetails });
                      
                      await MatchLineup.create({ match_id: match._id, team_id: team1._id, season_id: season._id, players: updateLineupStats(t1Players) });
                      await MatchLineup.create({ match_id: match._id, team_id: team2._id, season_id: season._id, players: updateLineupStats(t2Players) });

                       const tr1 = cachedTeamResults.find(t => t.team_id.toString() === team1._id.toString());
                       const tr2 = cachedTeamResults.find(t => t.team_id.toString() === team2._id.toString());
                       tr1.matchplayed += 1; tr2.matchplayed += 1;
                       tr1.goalsFor += r.goals1; tr1.goalsAgainst += r.goals2; tr1.goalsDifference = tr1.goalsFor - tr1.goalsAgainst;
                       tr2.goalsFor += r.goals2; tr2.goalsAgainst += r.goals1; tr2.goalsDifference = tr2.goalsFor - tr2.goalsAgainst;

                       if (r.goals1 > r.goals2) { tr1.wins += 1; tr1.points += 3; tr2.losses += 1; } 
                       else if (r.goals1 < r.goals2) { tr2.wins += 1; tr2.points += 3; tr1.losses += 1; } 
                       else { tr1.draws += 1; tr1.points += 1; tr2.draws += 1; tr2.points += 1; }

                       pastMatchesSimulated++;
                  }
                  
                  globalMatchCount++;
                  matchDateCursor = new Date(matchDateCursor.getTime() + intervalMs);
              }
          }
      }

      console.log(`✅ Lên lịch: ${pastMatchesSimulated} Trận Tỉ số & Lineups | ${upcomingMatchesScheduled} Trận Sắp diễn ra.`);

      for (const tr of cachedTeamResults) { await tr.save(); }
      for (const pr of Object.values(playerStatsMap)) { 
          await pr.save(); 
          await Player.findByIdAndUpdate(pr.player_id, { goals: pr.totalGoals, assists: pr.assists, yellow_cards: pr.yellowCards });
      }

      // 6. Xếp hạng TỰ ĐỘNG THEO KẾT QUẢ
      const finalResults = [...cachedTeamResults].sort((a,b) => b.points - a.points || b.goalsDifference - a.goalsDifference || b.goalsFor - a.goalsFor);
      for(let rank = 0; rank < finalResults.length; rank++) {
         await Ranking.create({ team_result_id: finalResults[rank]._id, season_id: season._id, rank: rank + 1, date: normalizedToday });
      }

      const cachedPRList = Object.values(playerStatsMap).sort((a,b) => b.totalGoals - a.totalGoals || b.assists - a.assists || a.matchesplayed - b.matchesplayed);
      const topScorers = cachedPRList.filter(pr => pr.totalGoals > 0);
      for(let rank = 0; rank < topScorers.length; rank++) {
          await PlayerRanking.create({ season_id: season._id, player_results_id: topScorers[rank]._id, player_id: topScorers[rank].player_id, rank: rank + 1, date: normalizedToday });
      }

      console.log('✅ Đã chốt Bảng Xếp Hạng Đội Cầu Thủ!');
    }

    console.log('\n======================================================');
    console.log('🌟 DỮ LIỆU ĐẠI TỔNG HỢP VÀ LỊCH SỬ/TƯƠNG LAI HOÀN TẤT 🌟');
    console.log('👉 Đã mô phỏng siêu chi tiết: ' + globalMatchCount + ' Trận đấu (Gồm cả ĐÃ ĐÁ và CHƯA ĐÁ).');
    console.log('👉 Account Đăng nhập: [admin@gmail.com / admin123]');
    process.exit();

  } catch (error) {
    console.error('❌ Lỗi DB:', error);
    process.exit(1);
  }
};

seedDB();
