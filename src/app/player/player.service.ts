import { Injectable, OnDestroy } from '@angular/core';
import { db } from "../shared/database";
import { Player, DEFAULT_PLAYER_STATS } from "../shared/types";
import { BehaviorSubject } from "rxjs";
import { liveQuery } from "dexie";

const ACTIVE_PLAYER_KEY = 'Greed.activePlayer';

@Injectable({
  providedIn: 'root'
})
export class PlayerService implements OnDestroy {

  _activePlayer: Player | undefined;
  private activePlayerSub: any;
  readonly activePlayerChanged = new BehaviorSubject<Player | undefined>(undefined);

  constructor() {
    const activePlayer = localStorage.getItem(ACTIVE_PLAYER_KEY);
    if (activePlayer) {
      this.setActivePlayer(JSON.parse(activePlayer));
    }
  }

  ngOnDestroy() {
    this.activePlayerSub?.unsubscribe();
  }

  async getPlayerCount() {
    const activePlayers = await this.getActivePlayers();
    return activePlayers.length;
  }

  async createPlayer(name: string) {
    const result = await db.players.add({
      name,
      isUser: 0,
      isActive: 1,
      ...DEFAULT_PLAYER_STATS
    });
    return result;
  }

  setActivePlayer = (player: Player) => {
    this._activePlayer = player;
    if (this._activePlayer) {
      localStorage.setItem(ACTIVE_PLAYER_KEY, JSON.stringify(player));
      this.activePlayerSub?.unsubscribe();
      this.activePlayerSub = liveQuery(() => this.getPlayer(this._activePlayer!.id!))
        .subscribe(player => {
          this._activePlayer = player;
          this.activePlayerChanged.next(this._activePlayer!);
        });
    }
  }

  resetActivePlayer = () => {
    this._activePlayer = undefined;
  }

  getActivePlayer() {
    return this._activePlayer;
  }

  async updatePlayer(id: number, changes: Partial<Player>) {
    await db.players.update(id, changes);
  }

  async deactivatePlayer(id: number) {
    const result = await db.players.update(id, { isActive: 0 });
    return result;
  }

  getPlayer(id: number) {
    return db.players.get(id);
  }

  getPlayers() {
    return db.players.toArray();
  }

  getActivePlayers() {
    return db.players.where({ isActive: 1 }).toArray();
  }

  getUserPlayer() {
    return db.players.where({ isUser: 1, isActive: 1 }).first();
  }

  async bookmarkPlayer(id?: number) {
    const players = await db.players.toArray();
    for (const player of players) {
      db.players.update(player.id!, { isUser: 0 });
    }
    if (id) {
      db.players.update(id, { isUser: 1 });
    }
  }

}
