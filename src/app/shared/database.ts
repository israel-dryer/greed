import Dexie, { Table } from "dexie";
import { GreedGame, Player, Turn, Settings, DEFAULT_SETTINGS } from "./types";

export class AppDb extends Dexie {

  games!: Table<GreedGame, number>;
  players!: Table<Player, number>;
  settings!: Table<Settings, number>;
  turns!: Table<Turn, number>;
  isPersistent = false;

  constructor() {
    super('GreedDb');
    this.persist().then(isPersistent => {
      this.isPersistent = isPersistent;
      console.log('Storage is persistent: ', this.isPersistent);
    });

    this.version(1).stores({
      games: '++id,createdOn,status',
      players: '++id,[isUser+isActive],isUser,isActive',
      turns: '++id,gameId,playerId,turnNumber,roundNumber,endedAt,[gameId+turnNumber]',
      settings: '++id'
    });

    this.on('populate', () => {
      this.settings.add({ ...DEFAULT_SETTINGS });
    });
  }

  async persist() {
    return navigator.storage && navigator.storage.persist && navigator.storage.persist();
  }
}

export const db = new AppDb();
