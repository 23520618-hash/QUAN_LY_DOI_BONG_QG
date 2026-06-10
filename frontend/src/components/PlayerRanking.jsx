import React, { useState, useEffect } from 'react';

const PlayerRanking = ({ playerResults, teams, token, searchTerm }) => {
    const [playersWithDetails, setPlayersWithDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 10;
    const defaultAvatarUrl = 'https://th.bing.com/th/id/OIP.2Kb4oZ95hq4HKWdUFHweAAAAAA?w=166&h=180&c=7&pcl=292827&r=0&o=5&dpr=1.3&pid=1.7';

    useEffect(() => {
        const buildPlayerDetails = () => {
            setLoading(true);
            setError('');

            if (!playerResults || playerResults.length === 0) {
                setPlayersWithDetails([]);
                setLoading(false);
                return;
            }
            
            // Dữ liệu đã được join ở backend, giờ chỉ cần map lại cho đúng
            const detailedPlayers = playerResults.map(result => {
                const team = teams.find((t) => t._id === result.team_id) || {
                    team_name: result.teamName || 'Không xác định',
                    logo: 'https://th.bing.com/th/id/OIP.iiLfIvv8F-PfjMrjObypGgHaHa?rs=1&pid=ImgDetMain',
                };
                return {
                    ...result,
                    // Dòng quan trọng: Đọc avatar từ playerInfo
                    playerAvatar: result.playerInfo?.avatar || defaultAvatarUrl,
                    teamName: team.team_name,
                    teamLogo: team.logo,
                };
            });
            setPlayersWithDetails(detailedPlayers);
            setLoading(false);
        };
        buildPlayerDetails();
    }, [playerResults, teams]);
    
    const filteredAndSortedPlayers = playersWithDetails
        .filter(player => 
            player.playerName && player.playerName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            if (b.assists !== a.assists) return b.assists - a.assists;
            return (a.playerName || '').localeCompare(b.playerName || '');
        });

    const topPlayer = filteredAndSortedPlayers[0];
    const remainingPlayers = filteredAndSortedPlayers.slice(1);

    const indexOfLastPlayer = currentPage * playersPerPage;
    const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
    const paginatedPlayers = remainingPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);
    const totalPages = Math.ceil(remainingPlayers.length / playersPerPage) || 1;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleImageError = (e, isTeamLogo = false) => {
        e.target.src = isTeamLogo ? 'https://th.bing.com/th/id/OIP.iiLfIvv8F-PfjMrjObypGgHaHa?rs=1&pid=ImgDetMain' : defaultAvatarUrl;
        e.target.onerror = null; 
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {filteredAndSortedPlayers.length === 0 && !loading ? (
                 <p className="text-center text-gray-500 py-10">Không tìm thấy cầu thủ nào phù hợp.</p>
            ) : topPlayer ? (
                <div className="mb-8 p-6 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl shadow-xl border-2 border-yellow-400">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-shrink-0">
                            <img
                                src={topPlayer.playerAvatar?.startsWith('http') || topPlayer.playerAvatar?.startsWith('/') ? topPlayer.playerAvatar : `/images/players_avatar/${topPlayer.playerAvatar}`}
                                alt={`${topPlayer.playerName} avatar`}
                                className="w-32 h-32 rounded-full object-cover shadow-lg"
                                onError={(e) => handleImageError(e)}
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-bold mb-2">
                                {topPlayer.playerName} (#{topPlayer.playerNumber})
                            </h2>
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                <img
                                    src={topPlayer.teamLogo?.startsWith('http') || topPlayer.teamLogo?.startsWith('/') ? topPlayer.teamLogo : `/images/teams_logo/${topPlayer.teamLogo}`}
                                    alt={`${topPlayer.teamName} logo`}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => handleImageError(e, true)}
                                />
                                <p className="text-lg">{topPlayer.teamName}</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                                <p><span className="font-semibold">Số trận:</span> {topPlayer.matchesPlayed}</p>
                                <p><span className="font-semibold">Bàn thắng:</span> {topPlayer.goals}</p>
                                <p><span className="font-semibold">Kiến tạo:</span> {topPlayer.assists}</p>
                                <p><span className="font-semibold">Thẻ vàng:</span> {topPlayer.yellowCards}</p>
                                <p><span className="font-semibold">Thẻ đỏ:</span> {topPlayer.redCards}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null }

            {remainingPlayers.length > 0 && (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr className="bg-gray-900 text-white text-3xl font-bold py-3 px-6 rounded-none border-l-8 border-red-600 mb-6 text-left tracking-wide hover:brightness-110 transition-all duration-200">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Hạng</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Cầu thủ</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Đội</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Trận</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Bàn thắng</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Kiến tạo</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Thẻ vàng</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">Thẻ đỏ</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800 text-sm font-light">
                                {paginatedPlayers.map((player, index) => (
                                    <tr
                                        key={player._id || player.player_id}
                                        className="border-b border-gray-200 hover:bg-red-50 transition duration-150"
                                    >
                                        <td className="px-6 py-4 font-semibold text-gray-700">
                                            {(currentPage - 1) * playersPerPage + index + 2}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img
                                                src={player.playerAvatar?.startsWith('http') || player.playerAvatar?.startsWith('/') ? player.playerAvatar : `/images/players_avatar/${player.playerAvatar}`}
                                                alt={`${player.playerName} avatar`}
                                                className="w-8 h-8 rounded-full object-cover shadow-sm"
                                                onError={(e) => handleImageError(e)}
                                            />
                                            <span className="font-medium text-gray-800">
                                                {player.playerName} (#{player.playerNumber})
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.teamName}</td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.matchesPlayed}</td>
                                        <td className="px-6 py-4 text-center text-red-600 font-semibold">{player.goals}</td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.assists}</td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.yellowCards}</td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.redCards}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium transition duration-200 ${currentPage === 1 ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-blue-100 hover:shadow-md'
                                    }`}
                            >
                                Trang trước
                            </button>
                            <span className="text-gray-600 font-medium">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage >= totalPages}
                                className={`px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium transition duration-200 ${currentPage >= totalPages ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-blue-100 hover:shadow-md'
                                    }`}
                            >
                                Trang tiếp theo
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PlayerRanking;