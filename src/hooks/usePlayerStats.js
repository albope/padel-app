// src/hooks/usePlayerStats.js
// Custom hook for calculating player statistics

import { useMemo } from 'react';
import dayjs from 'dayjs';

// List of main players
export const PLAYERS = ['Lucas', 'Bort', 'Martin', 'Ricardo'];

/**
 * Determines the winner of a match based on sets
 * @param {Object} result - Match result object
 * @returns {number} 1 if pair1 wins, 2 if pair2 wins, 0 if draw/invalid
 */
const getMatchWinner = (result) => {
  const { sets } = result;
  if (!Array.isArray(sets) || sets.length === 0) return 0;

  let pair1SetWins = 0;
  let pair2SetWins = 0;

  sets.forEach((set) => {
    const p1 = parseInt(set.pair1Score, 10) || 0;
    const p2 = parseInt(set.pair2Score, 10) || 0;
    if (p1 > p2) pair1SetWins++;
    else if (p2 > p1) pair2SetWins++;
  });

  if (pair1SetWins > pair2SetWins) return 1;
  if (pair2SetWins > pair1SetWins) return 2;
  return 0;
};

/**
 * Checks if a player was in a specific pair
 */
const isPlayerInPair = (pair, playerName) => {
  return pair?.player1 === playerName || pair?.player2 === playerName;
};

/**
 * Gets the partner of a player in a pair
 */
const getPartner = (pair, playerName) => {
  if (pair?.player1 === playerName) return pair?.player2;
  if (pair?.player2 === playerName) return pair?.player1;
  return null;
};

/**
 * Main hook for calculating player statistics
 */
const usePlayerStats = (results = [], selectedPlayer = null) => {
  // Filter results that include the selected player
  const playerResults = useMemo(() => {
    if (!selectedPlayer) return results;
    return results.filter(
      (r) =>
        isPlayerInPair(r.pair1, selectedPlayer) ||
        isPlayerInPair(r.pair2, selectedPlayer)
    );
  }, [results, selectedPlayer]);

  // Calculate basic stats for the selected player
  const basicStats = useMemo(() => {
    if (!selectedPlayer) {
      return { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, efficiency: 0, consecutiveWins: 0 };
    }

    let gamesPlayed = 0;
    let gamesWon = 0;
    let consecutiveWins = 0;
    let currentStreak = 0;

    // Sort by date for streak calculation
    const sortedResults = [...playerResults].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );

    sortedResults.forEach((result) => {
      const winner = getMatchWinner(result);
      if (winner === 0) return;

      gamesPlayed++;
      const playerInPair1 = isPlayerInPair(result.pair1, selectedPlayer);
      const playerWon = (winner === 1 && playerInPair1) || (winner === 2 && !playerInPair1);

      if (playerWon) {
        gamesWon++;
        currentStreak++;
        consecutiveWins = Math.max(consecutiveWins, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Get current streak (from most recent games)
    let actualCurrentStreak = 0;
    for (let i = sortedResults.length - 1; i >= 0; i--) {
      const result = sortedResults[i];
      const winner = getMatchWinner(result);
      if (winner === 0) continue;

      const playerInPair1 = isPlayerInPair(result.pair1, selectedPlayer);
      const playerWon = (winner === 1 && playerInPair1) || (winner === 2 && !playerInPair1);

      if (playerWon) {
        actualCurrentStreak++;
      } else {
        break;
      }
    }

    const gamesLost = gamesPlayed - gamesWon;
    const efficiency = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

    return {
      gamesPlayed,
      gamesWon,
      gamesLost,
      efficiency,
      consecutiveWins: actualCurrentStreak,
      maxStreak: consecutiveWins,
    };
  }, [playerResults, selectedPlayer]);

  // Calculate rivalry stats (head-to-head against each player)
  const rivalryStats = useMemo(() => {
    if (!selectedPlayer) return [];

    const rivals = PLAYERS.filter((p) => p !== selectedPlayer);
    const rivalryData = {};

    rivals.forEach((rival) => {
      rivalryData[rival] = { wins: 0, losses: 0, matches: [] };
    });

    playerResults.forEach((result) => {
      const winner = getMatchWinner(result);
      if (winner === 0) return;

      const playerInPair1 = isPlayerInPair(result.pair1, selectedPlayer);
      const playerPair = playerInPair1 ? result.pair1 : result.pair2;
      const opponentPair = playerInPair1 ? result.pair2 : result.pair1;
      const playerWon = (winner === 1 && playerInPair1) || (winner === 2 && !playerInPair1);

      // Check if any rival is in the opponent pair
      rivals.forEach((rival) => {
        if (isPlayerInPair(opponentPair, rival)) {
          rivalryData[rival].matches.push({
            date: result.date,
            won: playerWon,
            partner: getPartner(playerPair, selectedPlayer),
            rivalPartner: getPartner(opponentPair, rival),
          });
          if (playerWon) {
            rivalryData[rival].wins++;
          } else {
            rivalryData[rival].losses++;
          }
        }
      });
    });

    return rivals.map((rival) => {
      const data = rivalryData[rival];
      const total = data.wins + data.losses;
      const winRate = total > 0 ? Math.round((data.wins / total) * 100) : 0;

      return {
        rival,
        wins: data.wins,
        losses: data.losses,
        total,
        winRate,
        balance: data.wins - data.losses,
        matches: data.matches,
      };
    }).sort((a, b) => b.total - a.total);
  }, [playerResults, selectedPlayer]);

  // Calculate partnership stats (performance with each partner)
  const partnershipStats = useMemo(() => {
    if (!selectedPlayer) return [];

    const partners = PLAYERS.filter((p) => p !== selectedPlayer);
    const partnerData = {};

    partners.forEach((partner) => {
      partnerData[partner] = { wins: 0, games: 0, currentStreak: 0, matches: [] };
    });

    // Sort by date for streak calculation
    const sortedResults = [...playerResults].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );

    sortedResults.forEach((result) => {
      const winner = getMatchWinner(result);
      if (winner === 0) return;

      const playerInPair1 = isPlayerInPair(result.pair1, selectedPlayer);
      const playerPair = playerInPair1 ? result.pair1 : result.pair2;
      const partner = getPartner(playerPair, selectedPlayer);

      if (partner && partnerData[partner]) {
        const playerWon = (winner === 1 && playerInPair1) || (winner === 2 && !playerInPair1);
        partnerData[partner].games++;
        partnerData[partner].matches.push({ date: result.date, won: playerWon });

        if (playerWon) {
          partnerData[partner].wins++;
          partnerData[partner].currentStreak++;
        } else {
          partnerData[partner].currentStreak = 0;
        }
      }
    });

    // Calculate current streak for each partner
    partners.forEach((partner) => {
      let streak = 0;
      const matches = partnerData[partner].matches;
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i].won) {
          streak++;
        } else {
          break;
        }
      }
      partnerData[partner].currentStreak = streak;
    });

    return partners
      .map((partner) => {
        const data = partnerData[partner];
        const winRate = data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0;

        return {
          partner,
          wins: data.wins,
          games: data.games,
          winRate,
          currentStreak: data.currentStreak,
        };
      })
      .filter((p) => p.games > 0)
      .sort((a, b) => b.winRate - a.winRate || b.games - a.games);
  }, [playerResults, selectedPlayer]);

  // Calculate monthly evolution
  const evolutionStats = useMemo(() => {
    if (!selectedPlayer || playerResults.length === 0) return [];

    const monthlyData = {};

    playerResults.forEach((result) => {
      const winner = getMatchWinner(result);
      if (winner === 0) return;

      const month = dayjs(result.date).format('YYYY-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = { wins: 0, games: 0 };
      }

      const playerInPair1 = isPlayerInPair(result.pair1, selectedPlayer);
      const playerWon = (winner === 1 && playerInPair1) || (winner === 2 && !playerInPair1);

      monthlyData[month].games++;
      if (playerWon) monthlyData[month].wins++;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        label: dayjs(month).format('MMM YY'),
        wins: data.wins,
        games: data.games,
        efficiency: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [playerResults, selectedPlayer]);

  // Calculate trend (comparison with previous period)
  const trendStats = useMemo(() => {
    const currentMonth = dayjs().startOf('month');
    const previousMonth = currentMonth.subtract(1, 'month');

    let currentMonthStats = { wins: 0, games: 0 };
    let previousMonthStats = { wins: 0, games: 0 };

    playerResults.forEach((result) => {
      const winner = getMatchWinner(result);
      if (winner === 0) return;

      const resultDate = dayjs(result.date);
      const playerInPair1 = isPlayerInPair(result.pair1, selectedPlayer);
      const playerWon = (winner === 1 && playerInPair1) || (winner === 2 && !playerInPair1);

      if (resultDate.isSame(currentMonth, 'month')) {
        currentMonthStats.games++;
        if (playerWon) currentMonthStats.wins++;
      } else if (resultDate.isSame(previousMonth, 'month')) {
        previousMonthStats.games++;
        if (playerWon) previousMonthStats.wins++;
      }
    });

    const currentEfficiency =
      currentMonthStats.games > 0
        ? Math.round((currentMonthStats.wins / currentMonthStats.games) * 100)
        : 0;
    const previousEfficiency =
      previousMonthStats.games > 0
        ? Math.round((previousMonthStats.wins / previousMonthStats.games) * 100)
        : 0;

    const efficiencyChange = currentEfficiency - previousEfficiency;

    return {
      currentMonth: currentMonthStats,
      previousMonth: previousMonthStats,
      currentEfficiency,
      previousEfficiency,
      efficiencyChange,
      trend: efficiencyChange > 0 ? 'up' : efficiencyChange < 0 ? 'down' : 'neutral',
      gamesChange: currentMonthStats.games - previousMonthStats.games,
    };
  }, [playerResults, selectedPlayer]);

  // Calculate activity heatmap data (last 6 months)
  const activityStats = useMemo(() => {
    const sixMonthsAgo = dayjs().subtract(6, 'months').startOf('month');
    const activityMap = {};
    const locationCount = {};
    const dayOfWeekCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    playerResults.forEach((result) => {
      const resultDate = dayjs(result.date);
      if (resultDate.isBefore(sixMonthsAgo)) return;

      const dateKey = resultDate.format('YYYY-MM-DD');
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;

      // Count by day of week
      dayOfWeekCount[resultDate.day()]++;

      // Count by location
      if (result.location) {
        locationCount[result.location] = (locationCount[result.location] || 0) + 1;
      }
    });

    // Find most active day
    const mostActiveDay = Object.entries(dayOfWeekCount).reduce(
      (max, [day, count]) => (count > max.count ? { day: parseInt(day), count } : max),
      { day: 0, count: 0 }
    );

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Find favorite location
    const favoriteLocation = Object.entries(locationCount).reduce(
      (max, [loc, count]) => (count > max.count ? { location: loc, count } : max),
      { location: null, count: 0 }
    );

    // Count games this month
    const currentMonth = dayjs().startOf('month');
    const gamesThisMonth = playerResults.filter((r) =>
      dayjs(r.date).isSame(currentMonth, 'month')
    ).length;

    return {
      heatmap: activityMap,
      gamesThisMonth,
      mostActiveDay: dayNames[mostActiveDay.day],
      favoriteLocation: favoriteLocation.location,
      totalGames: playerResults.length,
    };
  }, [playerResults]);

  // Find best partner and nemesis
  const insights = useMemo(() => {
    const bestPartner = partnershipStats.length > 0 ? partnershipStats[0] : null;
    const nemesis = rivalryStats.find((r) => r.balance < 0 && r.total >= 2);
    const rival = rivalryStats.find((r) => r.balance > 0 && r.total >= 2);

    return {
      bestPartner,
      nemesis,
      strongestRival: rival,
    };
  }, [partnershipStats, rivalryStats]);

  return {
    basicStats,
    rivalryStats,
    partnershipStats,
    evolutionStats,
    trendStats,
    activityStats,
    insights,
    playerResults,
  };
};

export default usePlayerStats;
