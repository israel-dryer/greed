import Dexie, {Table} from "dexie";
import {Game, Player, Roll, Settings} from "./types";

export class AppDb extends Dexie {

  games!: Table<Game, number>;
  players!: Table<Player, number>;
  settings!: Table<Settings, number>;
  rolls!: Table<Roll, number>;

  constructor() {
    super('SettlersDiceDb');
    this.version(1).stores({
      games: '++id,createdOn',
      players: '++id,isActive,isUser',
      rolls: '++id,gameId,playerId',
      settings: '++id'
    });
    this.on('populate', () => {
      // add default settings
      this.settings.add({
        rollingDice: 1,
        robberLaugh: 1,
        barbarianAttack: 1,
        gameOver: 1,
        fairDice: 1,
        rollHaptics: 1,
        rollAnnouncer: 1
      });
    });
  }
}

export const db = new AppDb();
