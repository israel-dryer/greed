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
    const game = localStorage.getItem('activeGame');
    if (game) {
      this._activeGame = JSON.parse(game);
    }
  }

  getActiveGame() {
    return this._activeGame;
  }

  setActiveGame(game: Game) {
    this._activeGame = game;
    localStorage.setItem('activeGame', JSON.stringify(game));
  }

  async createGame(
    useFairDice: Bool,
    roster: RosterPlayer[],
    turnIndex = 0,
    isSeafarers: Bool = 0,
    isCitiesKnights: Bool = 0
  ) {
    const game: Game = {
      useFairDice,
      histogram: createHistogram(),
      createdOn: new Date().valueOf(),
      duration: 0,
      turnIndex,
      rollCount: 0,
      barbarianCount: 0,
      isSeafarers,
      isCitiesKnights,
      roster
    };
    game.id = await db.games.add(game);
    return game;
  }

  updateGame(id: number, changes: Record<string, any>) {
    return db.games.update(id, changes);
  }

  async deleteGame(id: number) {
    await db.games.delete(id);
    const rolls = await db.rolls.where({gameId: id}).toArray();
    const rollIds = rolls.map(r => r.id!);
    return db.rolls.bulkDelete(rollIds);
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
    dice1: number,
    dice2: number,
    diceAction?: ActionDiceResult
  ) {
    const total = dice1 + dice2;
    const isRobber = total === 7 ? 1 : 0;
    const roll: Roll = {
      gameId, playerId, playerName, dice1, dice2, total, diceAction, isRobber
    }
    roll.id = await db.rolls.add(roll);
    return roll;
  }

  async getRoll(id: number) {
    return db.rolls.get(id);
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

  async getRollsByPlayerId(playerId: number) {
    return db.rolls.where({playerId}).toArray();
  }

  async getRobberRollsByPlayer(playerId: number) {
    return db.rolls.where({playerId, isRobber: 1}).toArray();
  }

  async deleteRoll(id: number) {
    return db.rolls.delete(id);
  }

  async updateRoll(id: number, changes: Record<string, any>) {
    return db.rolls.update(id, changes);
  }

}
