import {Injectable} from '@angular/core';
import {ActionDiceResult, Bool, Game, Roll, RosterPlayer} from "../shared/types";
import {createHistogram} from "../shared/utilities";
import {db} from "../shared/database";

@Injectable({
  providedIn: 'root'
})
export class GameService {

  _activeGame?: Game;

  constructor() {
    this.getActiveGame().then();
  }

  getGameCount() {
    return db.games.count();
  }

  async getActiveGame() {
    if (!this._activeGame) {
      const jsonData = localStorage.getItem('SettlersDice.activeGame');
      if (!jsonData) return;
      const game = JSON.parse(jsonData);
      this._activeGame = await this.getGame(game.id!);
    }
    return this._activeGame;
  }

  setActiveGame(game: Game) {
    this._activeGame = game;
    localStorage.setItem('SettlersDice.activeGame', JSON.stringify(game));
  }

  async createGame(
    useFairDice: Bool,
    roster: RosterPlayer[],
    turnIndex = 0,
    isSeafarers: Bool = 0,
    isCitiesKnights: Bool = 0
  ) {
    const _nextPlayer = roster[turnIndex];
    const game: Game = {
      useFairDice,
      histogram: createHistogram(),
      createdOn: new Date().valueOf(),
      duration: 0,
      isSeafarers,
      isCitiesKnights,
      roster,
      state: {
        rollCount: 0,
        nextIndex: turnIndex,
        prevIndex: null,
        dice1Result: 0,
        dice2Result: 0,
        canShowRobber: true,
        fairDiceCollection: [],
        nextPlayer: {id: _nextPlayer.id, name: _nextPlayer.name},
        prevPlayer: undefined,
        lastRoll: undefined,
        barbarianCount: 0
      }
    };
    game.id = await db.games.add(game);
    await db.backupGames();
    return game;
  }

  async updateGame(id: number, changes: Record<string, any>) {
    const result = db.games.update(id, changes);
    await db.backupGames();
    return result;
  }

  async deleteGame(id: number) {
    await db.games.delete(id);
    const rolls = await db.rolls.where({gameId: id}).toArray();
    const rollIds = rolls.map(r => r.id!);
    await db.rolls.bulkDelete(rollIds);
    await db.backupGames();
    await db.backupRolls();
  }

  getGame(id: number) {
    return db.games.get(id);
  }

  getGames() {
    return db.games.toArray();
  }

  // Game Rolls

  async createRoll(
    gameId: number,
    playerId: number,
    playerName: string,
    turnIndex: number,
    dice1: number,
    dice2: number,
    diceAction?: ActionDiceResult,
  ) {
    const total = dice1 + dice2;
    const isRobber = total === 7 ? 1 : 0;
    const roll: Roll = {
      gameId, playerId, playerName, turnIndex, dice1, dice2, total, diceAction, isRobber
    }
    roll.id = await db.rolls.add(roll);
    await db.backupRolls();
    return roll;
  }

  async getRollsByGameId(gameId: number) {
    return db.rolls.where({gameId}).toArray();
  }

  async getLastRollByGameId(gameId: number) {
    return db.rolls
      .toCollection()
      .filter(roll => roll.gameId === gameId)
      .last();
  }

  async deleteRoll(id: number) {
    await db.rolls.delete(id);
    await db.backupRolls();
  }
}
