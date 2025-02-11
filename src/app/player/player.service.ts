import {Injectable} from '@angular/core';
import {db} from "../shared/database";
import {createHistogram} from "../shared/utilities";
import {Player} from "../shared/types";

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  _activePlayer: Player | undefined;

  constructor() {
    const activePlayer = localStorage.getItem('activePlayer');
    if (activePlayer) {
      this._activePlayer = JSON.parse(activePlayer);
    }

  }

  createPlayer(name: string) {
    return db.players.add(
      {
        name,
        isUser: 0,
        isActive: 1,
        histogram: createHistogram(),
        lastPlayed: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        secondsPlayed: 0,
        fastestWinSeconds: 0,
        longestWinsStreak: 0,
        robberRolls: 0,
        totalRolls: 0
      }
    );
  }

  setActivePlayer = (player: Player) => {
    this._activePlayer = player;
    localStorage.setItem('activePlayer', JSON.stringify(player));
  }

  resetActivePlayer = () => {
    this._activePlayer = undefined;
  }

  getActivePlayer() {
    return this._activePlayer;
  }

  updatePlayer(id: number, changes: Record<string, any>) {
    return db.players.update(id, changes);
  }

  deactivatePlayer(id: number) {
    return db.players.update(id, {isActive: 0});
  }

  getPlayer(id: number) {
    return db.players.get(id);
  }

  getPlayers() {
    return db.players.toArray();
  }

  getActivePlayers() {
    return db.players.where({isActive: 1}).toArray();
  }

  getUserPlayer() {
    return db.players.where({isUser: 1, isActive: 1}).first();
  }

  async bookmarkPlayer(id?: number) {
    const players = await db.players.toArray();
    for (const player of players) {
      db.players.update(player.id!, {isUser: 0});
    }
    if (id) {
      db.players.update(id, {isUser: 1});
    }
  }

}
