import { Injectable } from '@angular/core';
import { GreedGame, GameRules, RosterPlayer, Turn } from "../shared/types";
import { db } from "../shared/database";

const ACTIVE_GAME_KEY = 'Greed.activeGame';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  _activeGame?: GreedGame;

  constructor() {
    this.getActiveGame().then();
  }

  getGameCount() {
    return db.games.count();
  }

  async getActiveGame(): Promise<GreedGame | undefined> {
    if (!this._activeGame) {
      const jsonData = localStorage.getItem(ACTIVE_GAME_KEY);
      if (!jsonData) return undefined;
      const game = JSON.parse(jsonData);
      this._activeGame = await this.getGame(game.id!);
    }
    return this._activeGame;
  }

  setActiveGame(game: GreedGame | null) {
    if (game) {
      this._activeGame = game;
      localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(game));
    } else {
      this._activeGame = undefined;
      localStorage.removeItem(ACTIVE_GAME_KEY);
    }
  }

  async createGame(playerIds: number[], roster: RosterPlayer[], rules: GameRules): Promise<GreedGame> {
    const now = Date.now();

    // Initialize totals and onBoard for all players
    const totals: Record<number, number> = {};
    const onBoard: Record<number, boolean> = {};
    for (const playerId of playerIds) {
      totals[playerId] = 0;
      onBoard[playerId] = false;
    }

    const game: GreedGame = {
      createdOn: now,
      startedOn: now,
      status: 'in_progress',
      rules: { ...rules },
      playerIds,
      roster,
      currentPlayerIndex: 0,
      turnNumber: 1,
      totals,
      onBoard,
      lastBank: null,
    };

    game.id = await db.games.add(game);
    return game;
  }

  async updateGame(id: number, changes: Partial<GreedGame>): Promise<number> {
    return db.games.update(id, changes);
  }

  async deleteGame(id: number): Promise<void> {
    // Delete associated turns first
    const turns = await db.turns.where({ gameId: id }).toArray();
    const turnIds = turns.map(t => t.id!);
    await db.turns.bulkDelete(turnIds);
    // Then delete the game
    await db.games.delete(id);
  }

  getGame(id: number): Promise<GreedGame | undefined> {
    return db.games.get(id);
  }

  getGames(): Promise<GreedGame[]> {
    return db.games.toArray();
  }

  getGamesByStatus(status: GreedGame['status']): Promise<GreedGame[]> {
    return db.games.where({ status }).toArray();
  }

  // ===== Turn Methods =====

  async addTurn(turn: Turn): Promise<number> {
    turn.id = await db.turns.add(turn);
    return turn.id;
  }

  async getTurnsByGameId(gameId: number): Promise<Turn[]> {
    return db.turns.where({ gameId }).toArray();
  }

  async getActiveTurnsByGameId(gameId: number): Promise<Turn[]> {
    const turns = await db.turns.where({ gameId }).toArray();
    return turns.filter(t => !t.voided);
  }

  async getLastTurnByGameId(gameId: number): Promise<Turn | undefined> {
    const turns = await this.getActiveTurnsByGameId(gameId);
    if (turns.length === 0) return undefined;
    // Sort by turnNumber descending and return the first
    turns.sort((a, b) => b.turnNumber - a.turnNumber);
    return turns[0];
  }

  async voidTurn(turnId: number): Promise<void> {
    await db.turns.update(turnId, {
      voided: { at: Date.now(), reason: 'undo' }
    });
  }

  async deleteTurn(id: number): Promise<void> {
    await db.turns.delete(id);
  }

  async getTurnCount(): Promise<number> {
    return db.turns.count();
  }

  async getTurnsByPlayerId(playerId: number): Promise<Turn[]> {
    return db.turns.where({ playerId }).toArray();
  }

  async getActiveTurnsByPlayerId(playerId: number): Promise<Turn[]> {
    const turns = await db.turns.where({ playerId }).toArray();
    return turns.filter(t => !t.voided);
  }
}
