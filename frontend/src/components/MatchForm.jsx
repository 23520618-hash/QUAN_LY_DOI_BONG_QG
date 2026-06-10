import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ── helpers ──────────────────────────────────────────────────────────────────

const getPositionAbbreviation = (position) => {
  if (!position) return 'SUB';
  const p = position.toLowerCase();
  if (p.includes('forward')   || p.includes('tiền đạo')) return 'FW';
  if (p.includes('midfielder')|| p.includes('tiền vệ'))  return 'MF';
  if (p.includes('defender')  || p.includes('hậu vệ'))   return 'DF';
  if (p.includes('goalkeeper')|| p.includes('thủ môn'))  return 'GK';
  return 'SUB';
};

const emptyGoal = (goalRegulation) => ({
  playerId: '',
  minute: '',
  goalType: goalRegulation?.rules?.goalTypes?.[0] || 'normal',
  beneficiaryTeamId: '',
});

// ── component ─────────────────────────────────────────────────────────────────

const MatchForm = ({ editingMatch, setEditingMatch, setShowForm, setMatches, token, seasons }) => {
  const initialFormData = {
    date: '',
    time: '15:00',
    stadium: '',
    score: '',
    team1Name: '',
    team2Name: '',
  };

  const [formData, setFormData]                     = useState(initialFormData);
  const [goalDetails, setGoalDetails]               = useState([]);
  const [lineupTeam1Players, setLineupTeam1Players] = useState([]);
  const [lineupTeam2Players, setLineupTeam2Players] = useState([]);
  const [allPlayersOfTeam1, setAllPlayersOfTeam1]   = useState([]);
  const [allPlayersOfTeam2, setAllPlayersOfTeam2]   = useState([]);
  const [goalRegulation, setGoalRegulation]         = useState(null);
  const [ageRegulation, setAgeRegulation]           = useState(null);
  const [error, setError]                           = useState('');
  const [success, setSuccess]                       = useState('');
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [loadingPlayers, setLoadingPlayers]         = useState(false);
  const [loadingLineups, setLoadingLineups]         = useState(false);

  const [selectedSeasonId, setSelectedSeasonId]     = useState('');
  const [teamsInSeason, setTeamsInSeason]           = useState([]);
  const [team1Id, setTeam1Id]                       = useState('');
  const [team2Id, setTeam2Id]                       = useState('');

  // Flag to stop the score↔goals circular effect
  const scoreFromGoals = useRef(false);

  // ── data fetching ────────────────────────────────────────────────────────────

  const fetchLineupForTeam = async (matchId, teamId, setLineupFn) => {
    if (!matchId || !teamId) { setLineupFn([]); return; }
    setLoadingLineups(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/matchlineups/match/${matchId}/team/${teamId}`
      );
      if (res.data?.status === 'success' && res.data?.data?.players) {
        setLineupFn(res.data.data.players.map(p => ({
          player_id:     p.player_id._id || p.player_id,
          position:      p.position,
          jersey_number: p.jersey_number,
        })));
      } else {
        setLineupFn([]);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error(`Lỗi lấy đội hình:`, err.response?.data || err.message);
      }
      setLineupFn([]);
    } finally {
      setLoadingLineups(false);
    }
  };

  // ── init from editingMatch ───────────────────────────────────────────────────

  useEffect(() => {
    if (editingMatch?.team1 && editingMatch?.team2) {
      const matchId    = editingMatch.id || editingMatch._id;
      const dateObj    = editingMatch.date ? new Date(editingMatch.date) : null;
      const hh         = dateObj ? String(dateObj.getHours()).padStart(2, '0')   : '15';
      const mm         = dateObj ? String(dateObj.getMinutes()).padStart(2, '0') : '00';
      const validTime  = !isNaN(parseInt(hh)) && !isNaN(parseInt(mm));

      setFormData({
        date:      dateObj ? dateObj.toISOString().split('T')[0] : '',
        time:      validTime ? `${hh}:${mm}` : '15:00',
        stadium:   editingMatch.stadium || '',
        score:     editingMatch.score == null ? '' : (editingMatch.score || ''),
        team1Name: editingMatch.team1?.team_name || '',
        team2Name: editingMatch.team2?.team_name || '',
      });

      setGoalDetails(
        (editingMatch.goalDetails || []).map(g => ({
          playerId:         typeof g.player_id === 'string' ? g.player_id : g.player_id?._id,
          minute:           g.minute,
          goalType:         g.goalType || 'normal',
          beneficiaryTeamId: typeof g.team_id === 'string' ? g.team_id : g.team_id?._id,
        }))
      );

      fetchLineupForTeam(matchId, editingMatch.team1._id, setLineupTeam1Players);
      fetchLineupForTeam(matchId, editingMatch.team2._id, setLineupTeam2Players);

      // Fetch all players for each team
      const fetchPlayers = async (teamId, setFn, label) => {
        if (!teamId) { setFn([]); return; }
        setLoadingPlayers(true);
        try {
          const res = await axios.get(`http://localhost:5000/api/players/team/${teamId}`);
          setFn(res.data?.data || []);
        } catch (err) {
          console.error(`Lỗi lấy cầu thủ đội ${label}:`, err.response?.data || err.message);
          setFn([]);
        } finally {
          setLoadingPlayers(false);
        }
      };

      fetchPlayers(editingMatch.team1._id, setAllPlayersOfTeam1, editingMatch.team1.team_name);
      fetchPlayers(editingMatch.team2._id, setAllPlayersOfTeam2, editingMatch.team2.team_name);

      // Fetch regulations
      const seasonId = editingMatch.season_id?._id || editingMatch.season_id;
      if (seasonId && typeof seasonId === 'string') {
        (async () => {
          try {
            const [goalRes, ageRes] = await Promise.allSettled([
              axios.get(`http://localhost:5000/api/regulations/${seasonId}/Goal%20Rules`),
              axios.get(`http://localhost:5000/api/regulations/${seasonId}/Age%20Regulation`),
            ]);
            if (goalRes.status === 'fulfilled' && typeof goalRes.value.data?.data === 'string') {
              const detail = await axios.get(
                `http://localhost:5000/api/regulations/${goalRes.value.data.data}`
              );
              if (detail.data?.status === 'success') setGoalRegulation(detail.data.data);
            }
            if (ageRes.status === 'fulfilled' && typeof ageRes.value.data?.data === 'string') {
              const detail = await axios.get(
                `http://localhost:5000/api/regulations/${ageRes.value.data.data}`
              );
              if (detail.data?.status === 'success') setAgeRegulation(detail.data.data);
            }
          } catch (err) {
            console.error('Lỗi tải Regulations:', err.message);
          }
        })();
      }
    } else {
      setFormData(initialFormData);
      setGoalDetails([]);
      setAllPlayersOfTeam1([]);
      setAllPlayersOfTeam2([]);
      setLineupTeam1Players([]);
      setLineupTeam2Players([]);
      setGoalRegulation(null);
      setAgeRegulation(null);
      setSelectedSeasonId('');
      setTeam1Id('');
      setTeam2Id('');
      setTeamsInSeason([]);
    }
  }, [editingMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editingMatch && selectedSeasonId) {
      const fetchTeams = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/teams/seasons/${selectedSeasonId}`);
          setTeamsInSeason(res.data?.data || []);
        } catch (err) {
          setTeamsInSeason([]);
        }
      };
      fetchTeams();

      // Fetch regulations
      (async () => {
        try {
          const [goalRes, ageRes] = await Promise.allSettled([
            axios.get(`http://localhost:5000/api/regulations/${selectedSeasonId}/Goal%20Rules`),
            axios.get(`http://localhost:5000/api/regulations/${selectedSeasonId}/Age%20Regulation`),
          ]);
          if (goalRes.status === 'fulfilled' && typeof goalRes.value.data?.data === 'string') {
            const detail = await axios.get(`http://localhost:5000/api/regulations/${goalRes.value.data.data}`);
            if (detail.data?.status === 'success') setGoalRegulation(detail.data.data);
          }
          if (ageRes.status === 'fulfilled' && typeof ageRes.value.data?.data === 'string') {
            const detail = await axios.get(`http://localhost:5000/api/regulations/${ageRes.value.data.data}`);
            if (detail.data?.status === 'success') setAgeRegulation(detail.data.data);
          }
        } catch (err) {
          console.error('Lỗi tải Regulations:', err.message);
        }
      })();
    } else if (!editingMatch) {
      setTeamsInSeason([]);
      setTeam1Id('');
      setTeam2Id('');
      setGoalRegulation(null);
      setAgeRegulation(null);
    }
  }, [selectedSeasonId, editingMatch]);

  useEffect(() => {
    if (!editingMatch) {
      const fetchPlayers = async (teamId, setFn, label) => {
        if (!teamId) { setFn([]); return; }
        setLoadingPlayers(true);
        try {
          const res = await axios.get(`http://localhost:5000/api/players/team/${teamId}`);
          setFn(res.data?.data || []);
        } catch (err) {
          setFn([]);
        } finally {
          setLoadingPlayers(false);
        }
      };

      fetchPlayers(team1Id, setAllPlayersOfTeam1, '1');
      fetchPlayers(team2Id, setAllPlayersOfTeam2, '2');
    }
  }, [team1Id, team2Id, editingMatch]);

  useEffect(() => {
    if (!editingMatch) {
      const t1 = teamsInSeason.find(t => t._id === team1Id);
      const t2 = teamsInSeason.find(t => t._id === team2Id);
      setFormData(prev => ({
        ...prev,
        team1Name: t1 ? t1.team_name : '',
        team2Name: t2 ? t2.team_name : ''
      }));
    }
  }, [team1Id, team2Id, teamsInSeason, editingMatch]);

  // ── Auto-update score when goal details change ───────────────────────────────

  useEffect(() => {
    if (goalDetails.length === 0) {
      if (formData.score !== '' && formData.score !== '0-0') {
        scoreFromGoals.current = true;
        setFormData(prev => ({ ...prev, score: '' }));
      }
      return;
    }
    const t1id = String((editingMatch?.team1?._id || team1Id) || '');
    const t2id = String((editingMatch?.team2?._id || team2Id) || '');
    let t1 = 0, t2 = 0;
    goalDetails.forEach(g => {
      const bId = String(g.beneficiaryTeamId || '');
      if (bId === t1id) t1++;
      else if (bId === t2id) t2++;
    });
    const newScore = `${t1}-${t2}`;
    if (formData.score !== newScore) {
      scoreFromGoals.current = true;
      setFormData(prev => ({ ...prev, score: newScore }));
    }
  }, [goalDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync goal slot count when score is manually typed ────────────────────────

  useEffect(() => {
    // Skip if score was just set by the goals effect above
    if (scoreFromGoals.current) {
      scoreFromGoals.current = false;
      return;
    }
    if (!formData.score || !/^\d+-\d+$/.test(formData.score)) return;
    const [t1, t2] = formData.score.split('-').map(Number);
    const total = t1 + t2;
    if (total !== goalDetails.length) {
      if (total > goalDetails.length) {
        const diff = total - goalDetails.length;
        setGoalDetails(prev => [...prev, ...Array.from({ length: diff }, () => emptyGoal(goalRegulation))]);
      } else {
        setGoalDetails(prev => prev.slice(0, total));
      }
    }
  }, [formData.score]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const validateScore = (score) => {
    if (score === '' || score == null) return true;
    return /^[0-9]+-[0-9]+$/.test(score);
  };

  const getPlayerByIdFromAll = (playerId) =>
    allPlayersOfTeam1.find(p => p._id === playerId) ||
    allPlayersOfTeam2.find(p => p._id === playerId);

  const validateGoalDetails = (currentScore, currentGoalDetails) => {
    if (!currentScore || !/^\d+-\d+$/.test(currentScore)) {
      if (currentGoalDetails.length > 0)
        return 'Không thể nhập chi tiết bàn thắng khi chưa có tỉ số hợp lệ.';
      return true;
    }

    const [team1GoalsInScore, team2GoalsInScore] = currentScore.split('-').map(Number);
    const totalGoalsInScore = team1GoalsInScore + team2GoalsInScore;

    if (currentGoalDetails.length !== totalGoalsInScore)
      return `Tổng số bàn thắng trong chi tiết (${currentGoalDetails.length}) không khớp với tỉ số (${totalGoalsInScore}).`;

    let countedTeam1 = 0;
    let countedTeam2 = 0;

    for (const goal of currentGoalDetails) {
      if (!goal.playerId || !goal.beneficiaryTeamId || !goal.goalType ||
          goal.minute === undefined || goal.minute === '') {
        return 'Vui lòng điền đầy đủ thông tin cho mỗi bàn thắng (Cầu thủ, Đội hưởng, Phút, Loại).';
      }

      const playerMasterData = getPlayerByIdFromAll(goal.playerId);
      if (!playerMasterData)
        return `Cầu thủ ghi bàn (ID: ${goal.playerId}) không tồn tại.`;

      const inT1 = lineupTeam1Players.some(p => p.player_id === goal.playerId);
      const inT2 = lineupTeam2Players.some(p => p.player_id === goal.playerId);
      if (!inT1 && !inT2)
        return `Cầu thủ ${playerMasterData.name} không có trong danh sách đội hình.`;

      const actualTeamId = playerMasterData.team_id?._id || playerMasterData.team_id;

      if (goal.goalType === 'OG') {
        if (actualTeamId === goal.beneficiaryTeamId)
          return `Bàn OG không hợp lệ: cầu thủ ${playerMasterData.name} và đội hưởng không thể cùng một đội.`;
      } else {
        if (actualTeamId !== goal.beneficiaryTeamId)
          return `Bàn thắng thường không hợp lệ: cầu thủ ${playerMasterData.name} không thể ghi bàn cho đội đối phương.`;
      }

      if (goal.beneficiaryTeamId === (editingMatch?.team1?._id || team1Id)) countedTeam1++;
      else if (goal.beneficiaryTeamId === (editingMatch?.team2?._id || team2Id)) countedTeam2++;

      if (goalRegulation?.rules?.goalTimeLimit) {
        const min = goalRegulation.rules.goalTimeLimit.minMinute || 0;
        const max = goalRegulation.rules.goalTimeLimit.maxMinute || 120;
        if (goal.minute < min || goal.minute > max)
          return `Phút ghi bàn '${goal.minute}' phải từ ${min} đến ${max}.`;
      }

      if (goalRegulation?.rules?.goalTypes &&
          !goalRegulation.rules.goalTypes.includes(goal.goalType))
        return `Loại bàn thắng '${goal.goalType}' không được phép.`;
    }

    // Check totals AFTER loop
    if (countedTeam1 !== team1GoalsInScore)
      return `Số bàn của ${formData.team1Name} (${countedTeam1}) không khớp tỉ số (${team1GoalsInScore}).`;
    if (countedTeam2 !== team2GoalsInScore)
      return `Số bàn của ${formData.team2Name} (${countedTeam2}) không khớp tỉ số (${team2GoalsInScore}).`;

    return true;
  };

  // ── Goal detail handlers ─────────────────────────────────────────────────────

  const handleGoalDetailChange = (index, field, value) => {
    setGoalDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGoalDetail = () => {
    setGoalDetails(prev => [...prev, emptyGoal(goalRegulation)]);
  };

  const removeGoalDetail = (index) => {
    setGoalDetails(prev => prev.filter((_, i) => i !== index));
  };

  // ── Lineup handlers ──────────────────────────────────────────────────────────

  const handleLineupPlayerChange = (teamLineup, setTeamLineup, index, field, value) => {
    const newLineup = [...teamLineup];
    if (field === 'player_id') {
      const pool = teamLineup === lineupTeam1Players ? allPlayersOfTeam1 : allPlayersOfTeam2;
      const sel  = pool.find(p => p._id === value);
      newLineup[index] = sel
        ? { ...newLineup[index], player_id: value, jersey_number: sel.number || '', position: getPositionAbbreviation(sel.position) }
        : { ...newLineup[index], player_id: '', jersey_number: '', position: '' };
    } else {
      newLineup[index] = { ...newLineup[index], [field]: value };
    }
    setTeamLineup(newLineup);
  };

  const addLineupPlayer    = (teamLineup, setTeamLineup) =>
    setTeamLineup([...teamLineup, { player_id: '', position: '', jersey_number: '' }]);

  const removeLineupPlayer = (teamLineup, setTeamLineup, index) =>
    setTeamLineup(teamLineup.filter((_, i) => i !== index));

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsSubmitting(true);

    if (!token) { setError('Vui lòng đăng nhập.'); setIsSubmitting(false); return; }

    const currentScore = formData.score.trim();
    if (!validateScore(currentScore)) {
      setError('Tỉ số phải dạng số-số (vd: 2-1) hoặc để trống.'); setIsSubmitting(false); return;
    }

    if (currentScore && /^\d+-\d+$/.test(currentScore)) {
      if (lineupTeam1Players.length !== 11 || lineupTeam2Players.length !== 11) {
        if (!window.confirm('Đội hình ra sân phải có đúng 11 cầu thủ mỗi đội.\nBạn có muốn BỎ QUA và Ép Lưu?')) {
          setError('Đội hình ra sân phải có đúng 11 cầu thủ mỗi đội.'); setIsSubmitting(false); return;
        }
      }
      const gk1 = lineupTeam1Players.filter(p => p.position === 'GK').length;
      const gk2 = lineupTeam2Players.filter(p => p.position === 'GK').length;
      if (gk1 !== 1 || gk2 !== 1) {
        if (!window.confirm('Mỗi đội phải có chính xác 1 Thủ môn (Vị trí: GK).\nBạn có muốn BỎ QUA và Ép Lưu?')) {
          setError('Mỗi đội phải có chính xác 1 Thủ môn (Vị trí: GK).'); setIsSubmitting(false); return;
        }
      }

      const maxForeign = ageRegulation?.rules?.maxForeignPlayers ?? 99;
      const f1 = lineupTeam1Players.reduce((count, p) => count + (allPlayersOfTeam1.find(x => x._id === p.player_id)?.isForeigner ? 1 : 0), 0);
      const f2 = lineupTeam2Players.reduce((count, p) => count + (allPlayersOfTeam2.find(x => x._id === p.player_id)?.isForeigner ? 1 : 0), 0);

      if (f1 > maxForeign || f2 > maxForeign) {
        if (!window.confirm(`Vượt quá số lượng ngoại binh tối đa cho phép (${maxForeign}).\nBạn có muốn BỎ QUA và Ép Lưu?`)) {
          setError(`Vượt quá số lượng ngoại binh tối đa cho phép (${maxForeign}).`); setIsSubmitting(false); return;
        }
      }

      const gv = validateGoalDetails(currentScore, goalDetails);
      if (gv !== true) { 
        if (!window.confirm(`LỖI DỮ LIỆU: ${gv}\n\nBạn có muốn BỎ QUA mọi ràng buộc và ÉP LƯU vào database không?`)) {
          setError(gv); setIsSubmitting(false); return; 
        }
      }
    } else if (goalDetails.length > 0) {
      if (!window.confirm('LỖI: Không thể có chi tiết bàn thắng khi chưa có tỉ số hợp lệ.\nBạn có muốn BỎ QUA và Ép Lưu?')) {
        setError('Không thể có chi tiết bàn thắng khi chưa có tỉ số hợp lệ.'); setIsSubmitting(false); return;
      }
    }

    if (!formData.date || isNaN(new Date(formData.date).getTime())) {
      alert('LỖI: Ngày thi đấu không hợp lệ.');
      setError('Ngày thi đấu không hợp lệ.'); setIsSubmitting(false); return;
    }
    if (!formData.time) {
      alert('LỖI: Giờ thi đấu không được để trống.');
      setError('Giờ thi đấu không được để trống.'); setIsSubmitting(false); return;
    }

    try {
      const [hh, mi]    = formData.time.split(':').map(Number);
      const matchDateTime = new Date(formData.date);
      matchDateTime.setHours(hh, mi, 0, 0);

      const headers = { Authorization: `Bearer ${token}` };

      let targetMatchId = editingMatch?.id || editingMatch?._id;
      let targetSeasonId = editingMatch?.season_id?._id || editingMatch?.season_id;
      let targetTeam1Id = editingMatch?.team1?._id;
      let targetTeam2Id = editingMatch?.team2?._id;

      if (!editingMatch) {
        if (!selectedSeasonId || !team1Id || !team2Id) {
          setError('Vui lòng chọn mùa giải và hai đội bóng.');
          setIsSubmitting(false);
          return;
        }
        if (team1Id === team2Id) {
          setError('Hai đội bóng phải khác nhau.');
          setIsSubmitting(false);
          return;
        }
        const payload = {
          season_id: selectedSeasonId,
          team1_id: team1Id,
          team2_id: team2Id,
          date: matchDateTime.toISOString(),
          stadium: formData.stadium,
        };
        const res = await axios.post('http://localhost:5000/api/matches/manual', payload, { headers });
        const newMatch = res.data.data;
        targetMatchId = newMatch._id;
        targetSeasonId = selectedSeasonId;
        targetTeam1Id = team1Id;
        targetTeam2Id = team2Id;

        if (!formData.score && lineupTeam1Players.length === 0 && lineupTeam2Players.length === 0) {
          setSuccess('Tạo trận đấu thành công!');
          window.location.reload();
          return;
        }
      }

      // Step 1: Save lineups
      if (lineupTeam1Players.length > 0) {
        await axios.post('http://localhost:5000/api/matchlineups',
          { match_id: targetMatchId, team_id: targetTeam1Id, season_id: targetSeasonId, players: lineupTeam1Players },
          { headers });
      }
      if (lineupTeam2Players.length > 0) {
        await axios.post('http://localhost:5000/api/matchlineups',
          { match_id: targetMatchId, team_id: targetTeam2Id, season_id: targetSeasonId, players: lineupTeam2Players },
          { headers });
      }

      // Step 2: Update match
      const matchPayload = {
        date:    matchDateTime.toISOString(),
        stadium: formData.stadium,
        score:   currentScore === '' ? null : currentScore,
        force:   true, // Ép lưu, bỏ qua validate backend theo yêu cầu của user
        goalDetails: currentScore === ''
          ? []
          : goalDetails.map(g => ({
              player_id: g.playerId,
              team_id:   g.beneficiaryTeamId,
              minute:    parseInt(g.minute, 10) || 0,
              goalType:  g.goalType,
            })),
      };

      const matchRes = await axios.put(
        `http://localhost:5000/api/matches/${targetMatchId}`, matchPayload, { headers }
      );

      // Step 3: Update results & rankings
      if (matchPayload.score && /^\d+-\d+$/.test(matchPayload.score)) {
        await axios.put(`http://localhost:5000/api/team_results/${targetMatchId}`, {}, { headers });
        await axios.put(`http://localhost:5000/api/player_results/match/${targetMatchId}`, {}, { headers });
        await axios.put(`http://localhost:5000/api/rankings/${targetSeasonId}`,
          { match_date: matchDateTime.toISOString().split('T')[0] }, { headers });
        await axios.put(`http://localhost:5000/api/player_rankings/match/${targetMatchId}`, {}, { headers });
        setSuccess('Cập nhật trận đấu, đội hình và kết quả thành công!');
      } else {
        setSuccess('Cập nhật thông tin trận đấu và đội hình thành công.');
      }

      // Lập tức khởi động lại để đọc data mới
      window.location.reload();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      alert(`LỖI LƯU DỮ LIỆU TỪ HỆ THỐNG:\n${errMsg}`);
      console.error('Submit error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Không thể lưu trận đấu hoặc đội hình.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderLineupInputs = (teamLabel, lineupPlayers, setTeamLineup, allTeamPlayers) => {
    const maxForeign = ageRegulation?.rules?.maxForeignPlayers ?? 99;
    const foreignCount = lineupPlayers.reduce((count, p) => {
      const pl = allTeamPlayers.find(x => x._id === p.player_id);
      return count + (pl?.isForeigner ? 1 : 0);
    }, 0);
    const isForeignLimitExceeded = foreignCount > maxForeign;

    return (
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-700 flex flex-wrap items-center gap-2">
          {teamLabel} — Đội hình ra sân
          <span className="text-xs text-gray-400 font-normal">
            ({lineupPlayers.length} cầu thủ)
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isForeignLimitExceeded ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
            Ngoại binh: {foreignCount}/{maxForeign}
          </span>
        </h3>
        
        {isForeignLimitExceeded && (
          <p className="text-xs text-red-600 font-medium">⚠️ Vượt quá số lượng ngoại binh cho phép!</p>
        )}

        {lineupPlayers.map((p, index) => {
          const pl = allTeamPlayers.find(x => x._id === p.player_id);
          const isForeign = pl?.isForeigner;

          return (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm items-end animate-slide-left hover:-translate-y-1 hover:shadow-lg hover:bg-white/60 transition-all duration-300 relative z-10">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-0.5 block flex justify-between font-medium">
                  <span>Cầu thủ</span>
                  {isForeign && <span className="text-red-500 font-bold">Ngoại binh</span>}
                </label>
                <select
                  value={p.player_id}
                  onChange={e => handleLineupPlayerChange(lineupPlayers, setTeamLineup, index, 'player_id', e.target.value)}
                  className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80"
                >
                  <option value="">— Chọn cầu thủ —</option>
                  {allTeamPlayers.map(plOption => (
                    <option key={plOption._id} value={plOption._id}>
                      {plOption.name} (#{plOption.number}) {plOption.isForeigner ? ' [Ngoại]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-0.5 block">Số áo</label>
                <input
                  type="text" value={p.jersey_number} placeholder="Số áo"
                  onChange={e => handleLineupPlayerChange(lineupPlayers, setTeamLineup, index, 'jersey_number', e.target.value)}
                  className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80"
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <label className="text-xs text-gray-500 mb-0.5 block">Vị trí</label>
                  <input
                    type="text" value={p.position} placeholder="GK/DF/MF/FW"
                    onChange={e => handleLineupPlayerChange(lineupPlayers, setTeamLineup, index, 'position', e.target.value)}
                    className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80"
                  />
                </div>
                <button type="button"
                  onClick={() => removeLineupPlayer(lineupPlayers, setTeamLineup, index)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-all duration-300 hover:shadow-glow hover:scale-105">
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        <button type="button"
          disabled={lineupPlayers.length >= 11}
          onClick={() => addLineupPlayer(lineupPlayers, setTeamLineup)}
          className="w-full py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition mt-1">
          + Thêm cầu thủ — {teamLabel} {lineupPlayers.length >= 11 ? '(Đã đủ 11 người)' : ''}
        </button>
      </div>
    );
  };

  // ── JSX ──────────────────────────────────────────────────────────────────────

  const hasValidScore = formData.score && /^\d+-\d+$/.test(formData.score);

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] animate-fade-in-down relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <h2 className="text-3xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 mb-6 text-center animate-slide-in-up relative z-10 drop-shadow-sm">
        {editingMatch ? '✏️ Sửa Trận Đấu & Đội Hình' : '➕ Thêm Trận Đấu'}
      </h2>

      {error   && <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg mb-4 text-center text-sm font-medium">{error}</p>}
      {success && <p className="text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg mb-4 text-center text-sm font-medium">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isSubmitting || loadingPlayers || loadingLineups} className="space-y-6">

          {/* ── Sticky match info header ─────────────────────────────────── */}
          <div className="sticky top-0 z-20 bg-white/50 backdrop-blur-lg pb-4 pt-2 mb-2 border-b border-white/40 rounded-t-3xl animate-slide-up shadow-[0_4px_30px_rgba(0,0,0,0.02)] relative">
            {/* Team names or Selectors */}
            {!editingMatch ? (
              <div className="mb-5 bg-white/30 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                <div className="mb-3 relative z-10">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giải đấu <span className="text-red-500">*</span></label>
                  <select value={selectedSeasonId} onChange={(e) => setSelectedSeasonId(e.target.value)} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/50 rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400 focus:bg-white/80 focus:outline-none transition-all duration-300 hover:shadow-md hover:border-white/80 cursor-pointer" required>
                    <option value="">-- Chọn giải đấu --</option>
                    {(seasons || []).map(s => <option key={s._id} value={s._id}>{s.season_name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Đội 1 <span className="text-red-500">*</span></label>
                    <select value={team1Id} onChange={(e) => setTeam1Id(e.target.value)} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/50 rounded-xl text-sm font-bold text-blue-700 shadow-sm focus:ring-2 focus:ring-blue-400 focus:bg-white/80 focus:outline-none transition-all duration-300 hover:shadow-md hover:border-white/80 cursor-pointer" required disabled={!selectedSeasonId}>
                      <option value="">-- Chọn đội 1 --</option>
                      {teamsInSeason.map(t => <option key={t._id} value={t._id}>{t.team_name}</option>)}
                    </select>
                  </div>
                  <span className="text-xl font-bold text-blue-400 mt-5 uppercase tracking-widest animate-pulse-glow drop-shadow-md">vs</span>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Đội 2 <span className="text-red-500">*</span></label>
                    <select value={team2Id} onChange={(e) => setTeam2Id(e.target.value)} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/50 rounded-xl text-sm font-bold text-red-600 shadow-sm focus:ring-2 focus:ring-red-400 focus:bg-white/80 focus:outline-none transition-all duration-300 hover:shadow-md hover:border-white/80 cursor-pointer" required disabled={!selectedSeasonId}>
                      <option value="">-- Chọn đội 2 --</option>
                      {teamsInSeason.map(t => <option key={t._id} value={t._id} disabled={t._id === team1Id}>{t.team_name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-3 px-1 bg-white/40 py-2 rounded-lg border border-gray-100 shadow-sm">
                <span className="font-semibold text-blue-700 text-sm px-3 flex items-center gap-1">⚽ {formData.team1Name || 'Đội 1'}</span>
                <span className="text-xl font-bold text-gray-700 tabular-nums animate-score-reveal">
                  {hasValidScore ? formData.score : '— vs —'}
                </span>
                <span className="font-semibold text-red-600 text-sm px-3 flex items-center gap-1">{formData.team2Name || 'Đội 2'} ⚽</span>
              </div>
            )}

            {/* Date / Time / Stadium / Score */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
              <div>
                <label htmlFor="match-date" className="block text-xs font-medium text-gray-600 mb-1">📅 Ngày <span className="text-red-500">*</span></label>
                <input id="match-date" type="date" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80 focus:shadow-glow" required />
              </div>
              <div>
                <label htmlFor="match-time" className="block text-xs font-medium text-gray-600 mb-1">🕐 Giờ <span className="text-red-500">*</span></label>
                <input id="match-time" type="time" value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80 focus:shadow-glow" required />
              </div>
              <div>
                <label htmlFor="stadium" className="block text-xs font-medium text-gray-600 mb-1">🏟️ Sân <span className="text-red-500">*</span></label>
                <input id="stadium" type="text" value={formData.stadium} placeholder="Tên sân"
                  onChange={e => setFormData({ ...formData, stadium: e.target.value })}
                  className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80 focus:shadow-glow" required />
              </div>
              <div>
                <label htmlFor="score" className="block text-xs font-medium text-gray-600 mb-1">🥅 Tỉ số</label>
                <input id="score" type="text" value={formData.score} placeholder="x-y (trống nếu chưa đá)"
                  onChange={e => setFormData({ ...formData, score: e.target.value })}
                  className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80 focus:shadow-glow" />
              </div>
            </div>
          </div>
          {/* ── End sticky header ─────────────────────────────────────────── */}

          {/* ── Lineups ─────────────────────────────────────────────────── */}
          {(editingMatch || (team1Id && team2Id)) && (
            <>
              {loadingLineups && (
                <p className="text-center text-blue-500 text-sm animate-pulse">Đang tải đội hình…</p>
              )}
              {renderLineupInputs(formData.team1Name || 'Đội 1', lineupTeam1Players, setLineupTeam1Players, allPlayersOfTeam1)}
              <hr className="border-gray-200" />
              {renderLineupInputs(formData.team2Name || 'Đội 2', lineupTeam2Players, setLineupTeam2Players, allPlayersOfTeam2)}
            </>
          )}

          {/* ── Goal details ─────────────────────────────────────────────── */}
          {hasValidScore && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">⚽ Chi Tiết Bàn Thắng</label>
                <span className="text-xs text-gray-400">
                  {goalDetails.filter(g => g.beneficiaryTeamId === (editingMatch?.team1?._id || team1Id)).length} — {goalDetails.filter(g => g.beneficiaryTeamId === (editingMatch?.team2?._id || team2Id)).length}
                </span>
              </div>

              {goalDetails.map((goal, index) => {
                // Determine which players to show based on Beneficiary Team and Goal Type
                let availablePlayers = [];
                let label = '';
                
                if (goal.beneficiaryTeamId && goal.goalType) {
                    const isOG = goal.goalType === 'OG';
                    const beneficiaryIsTeam1 = goal.beneficiaryTeamId === (editingMatch?.team1?._id || team1Id);
                    
                    if ((beneficiaryIsTeam1 && !isOG) || (!beneficiaryIsTeam1 && isOG)) {
                        availablePlayers = lineupTeam1Players;
                        label = `${formData.team1Name}`;
                    } else {
                        availablePlayers = lineupTeam2Players;
                        label = `${formData.team2Name}`;
                    }
                }

                return (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3 p-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm items-end animate-bounce-in hover:-translate-y-1 hover:shadow-lg hover:bg-white/60 transition-all duration-300 relative z-10">
                  
                  {/* Beneficiary team */}
                  <div>
                    <label className="text-xs text-gray-500 mb-0.5 block">Đội hưởng</label>
                    <select value={goal.beneficiaryTeamId || ''}
                      onChange={e => handleGoalDetailChange(index, 'beneficiaryTeamId', e.target.value)}
                      className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80" required>
                      <option value="">— Chọn đội —</option>
                      {(editingMatch?.team1 || team1Id) && <option value={editingMatch?.team1?._id || team1Id}>{formData.team1Name}</option>}
                      {(editingMatch?.team2 || team2Id) && <option value={editingMatch?.team2?._id || team2Id}>{formData.team2Name}</option>}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-xs text-gray-500 mb-0.5 block">Loại</label>
                    <select value={goal.goalType || 'normal'}
                      onChange={e => {
                        handleGoalDetailChange(index, 'goalType', e.target.value);
                        // Reset player if type changes because available players might change
                        handleGoalDetailChange(index, 'playerId', '');
                      }}
                      className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80" required>
                      {goalRegulation?.rules?.goalTypes?.length > 0
                        ? goalRegulation.rules.goalTypes.map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))
                        : <option value="normal">Normal</option>}
                    </select>
                  </div>

                  {/* Player */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 mb-0.5 block">Cầu thủ #{index + 1}</label>
                    <select value={goal.playerId || ''}
                      onChange={e => handleGoalDetailChange(index, 'playerId', e.target.value)}
                      disabled={!goal.beneficiaryTeamId}
                      className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 disabled:bg-gray-200/50 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80" required>
                      <option value="">{goal.beneficiaryTeamId ? '— Chọn cầu thủ —' : '— Chọn Đội hưởng trước —'}</option>
                      {availablePlayers.length > 0 && (
                        <optgroup label={`${label} (Đội hình)`}>
                          {availablePlayers
                            .map(p => getPlayerByIdFromAll(p.player_id))
                            .filter(Boolean)
                            .map(pl => (
                              <option key={pl._id} value={pl._id}>{pl.name} (#{pl.number})</option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Minute + Delete */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <label className="text-xs text-gray-500 mb-0.5 block">Phút</label>
                        <input type="number" value={goal.minute || ''}
                        onChange={e => handleGoalDetailChange(index, 'minute', e.target.value)}
                        placeholder="Phút" required
                        min={goalRegulation?.rules?.goalTimeLimit?.minMinute || 0}
                        max={goalRegulation?.rules?.goalTimeLimit?.maxMinute || 120}
                        className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/80 text-sm transition-all duration-300 hover:shadow-md hover:border-white/80" />
                    </div>
                    <button type="button" onClick={() => removeGoalDetail(index)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-all duration-300 hover:shadow-glow hover:scale-105">
                      ✕
                    </button>
                  </div>
                </div>
                );
              })}

              <button type="button" onClick={addGoalDetail}
                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 mt-1">
                + Thêm Bàn Thắng
              </button>
            </div>
          )}

          {/* ── Action buttons ───────────────────────────────────────────── */}
          <div className="flex justify-center gap-4 pt-4 relative z-10">
            <button type="submit" disabled={isSubmitting || loadingPlayers || loadingLineups}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-2xl shadow-[0_4px_15px_rgba(37,99,235,0.3)] flex items-center justify-center min-w-[130px] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(37,99,235,0.5)] hover:-translate-y-1 hover:scale-105 font-medium tracking-wide">
              {isSubmitting
                ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                : (editingMatch ? '💾 Lưu Thay Đổi' : '➕ Thêm Trận')}
            </button>
            <button type="button"
              onClick={() => { setShowForm(false); setEditingMatch(null); setError(''); setSuccess(''); }}
              disabled={isSubmitting || loadingPlayers || loadingLineups}
              className="bg-white/60 backdrop-blur-md hover:bg-white/80 border border-white/80 disabled:opacity-50 text-gray-700 px-8 py-3 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:scale-105 font-medium tracking-wide">
              Thoát
            </button>
          </div>

        </fieldset>
      </form>
    </div>
  );
};

export default MatchForm;