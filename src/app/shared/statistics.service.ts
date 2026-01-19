import { Injectable } from '@angular/core';
import { db } from './database';
import { Turn, GreedGame, Player } from './types';

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winPct: number;
  turnsTaken: number;
  busts: number;
  bustPct: number;
  totalBanked: number;
  avgBank: number;
  largestBank: number;
  penalties: number;
  totalPenalty: number;
  lastPlayed: number;
}

export interface GameStats {
  totalTurns: number;
  rounds: number;
  avgBank: number;
  bustPct: number;
  totalBanked: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  async updatePlayerStatsById(id: number): Promise<void> {
    // Get all active turns for this player
    const allTurns = await db.turns.where({ playerId: id }).toArray();
    const turns = allTurns.filter(t => !t.voided);

    // Get all games this player participated in
    const allGames = await db.games.toArray();
    const playerGames = allGames.filter(g => g.playerIds.includes(id));

    // Calculate stats
    const gamesPlayed = playerGames.length;
    const gamesWon = playerGames.filter(g => g.winnerPlayerId === id).length;

    const turnsTaken = turns.length;
    const busts = turns.filter(t => t.outcome === 'BUST').length;
    const penalties = turns.filter(t => t.outcome === 'PENALTY').length;

    // Calculate bank stats (only positive banks)
    const positiveBanks = turns.filter(t => t.outcome === 'BANK' && t.deltaApplied > 0);
    const totalBanked = positiveBanks.reduce((sum, t) => sum + t.deltaApplied, 0);
    const largestBank = positiveBanks.length > 0
      ? Math.max(...positiveBanks.map(t => t.deltaApplied))
      : 0;

    // Calculate total penalty amount
    const totalPenalty = turns
      .filter(t => t.outcome === 'PENALTY')
      .reduce((sum, t) => sum + Math.abs(t.deltaApplied), 0);

    // Last played
    const lastPlayed = playerGames.length > 0
      ? Math.max(...playerGames.map(g => g.endedOn || g.startedOn))
      : 0;

    const changes: Partial<Player> = {
      gamesPlayed,
      gamesWon,
      turnsTaken,
      totalBanked,
      largestBank,
      busts,
      penalties,
      totalPenalty,
      lastPlayed
    };

    await db.players.update(id, changes);
  }

  async getPlayerStats(playerId: number): Promise<PlayerStats> {
    const player = await db.players.get(playerId);
    if (!player) {
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        winPct: 0,
        turnsTaken: 0,
        busts: 0,
        bustPct: 0,
        totalBanked: 0,
        avgBank: 0,
        largestBank: 0,
        penalties: 0,
        totalPenalty: 0,
        lastPlayed: 0
      };
    }

    // Get all active turns for this player
    const allTurns = await db.turns.where({ playerId }).toArray();
    const turns = allTurns.filter(t => !t.voided);

    const positiveBanks = turns.filter(t => t.outcome === 'BANK' && t.deltaApplied > 0);

    return {
      gamesPlayed: player.gamesPlayed,
      gamesWon: player.gamesWon,
      winPct: player.gamesPlayed > 0 ? (player.gamesWon / player.gamesPlayed) * 100 : 0,
      turnsTaken: player.turnsTaken,
      busts: player.busts,
      bustPct: player.turnsTaken > 0 ? (player.busts / player.turnsTaken) * 100 : 0,
      totalBanked: player.totalBanked,
      avgBank: positiveBanks.length > 0 ? player.totalBanked / positiveBanks.length : 0,
      largestBank: player.largestBank,
      penalties: player.penalties,
      totalPenalty: player.totalPenalty,
      lastPlayed: player.lastPlayed
    };
  }

  async getGameStats(gameId: number): Promise<GameStats> {
    const game = await db.games.get(gameId);
    if (!game) {
      return {
        totalTurns: 0,
        rounds: 0,
        avgBank: 0,
        bustPct: 0,
        totalBanked: 0
      };
    }

    const allTurns = await db.turns.where({ gameId }).toArray();
    const turns = allTurns.filter(t => !t.voided);

    const totalTurns = turns.length;
    const rounds = totalTurns > 0
      ? Math.max(...turns.map(t => t.roundNumber))
      : 0;

    const positiveBanks = turns.filter(t => t.outcome === 'BANK' && t.deltaApplied > 0);
    const totalBanked = positiveBanks.reduce((sum, t) => sum + t.deltaApplied, 0);
    const avgBank = positiveBanks.length > 0 ? totalBanked / positiveBanks.length : 0;

    const busts = turns.filter(t => t.outcome === 'BUST').length;
    const bustPct = totalTurns > 0 ? (busts / totalTurns) * 100 : 0;

    return {
      totalTurns,
      rounds,
      avgBank,
      bustPct,
      totalBanked
    };
  }

  async getGlobalStats(): Promise<{
    totalGames: number;
    totalTurns: number;
    totalPlayers: number;
  }> {
    const totalGames = await db.games.count();
    const allTurns = await db.turns.toArray();
    const totalTurns = allTurns.filter(t => !t.voided).length;
    const totalPlayers = await db.players.where({ isActive: 1 }).count();

    return {
      totalGames,
      totalTurns,
      totalPlayers
    };
  }
}
