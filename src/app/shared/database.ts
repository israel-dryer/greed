import Dexie, {Table} from "dexie";
import {Game, Player, Roll, Settings} from "./types";
import {Preferences} from "@capacitor/preferences";

export class AppDb extends Dexie {

  games!: Table<Game, number>;
  players!: Table<Player, number>;
  settings!: Table<Settings, number>;
  rolls!: Table<Roll, number>;
  isPersistent = false;

  constructor() {
    super('SettlersDiceDb');
    this.persist().then(isPersistent => {
      this.isPersistent = isPersistent;
      console.log('Storage is persistent: ', this.isPersistent);
    });

    this.version(5).stores({
      games: '++id,createdOn',
      players: '++id,[isUser+isActive],isUser,isActive',
      rolls: '++id,gameId,playerId',
      settings: '++id'
    });
    this.on('populate', () => {
      // add default settings
      this.settings.add({
        fairDice: 1,
        rollHaptics: 1,
        rollAnnouncer: 1,
        soundEffects: 1
      });
    });
  }

  async persist() {
    return navigator.storage && navigator.storage.persist && navigator.storage.persist();
  }

  async backupData() {
    await Preferences.clear();

    // fetch game data
    const games = await this.games.toArray();
    const players = await this.players.toArray();
    const settings = await this.settings.toArray();
    const rolls = await this.rolls.toArray();
    const activePlayer = localStorage.getItem('activePlayer');
    const gameCount = localStorage.getItem('gameCount');
    const playerCount = localStorage.getItem('playerCount');
    const userPlayer = localStorage.getItem('userPlayer');

    // save all data
    await Preferences.set({key: 'games', value: JSON.stringify(games)});
    await Preferences.set({key: 'players', value: JSON.stringify(players)});
    await Preferences.set({key: 'rolls', value: JSON.stringify(rolls)});
    await Preferences.set({key: 'settings', value: JSON.stringify(settings)});

    if (activePlayer) {
      await Preferences.set({key: 'activePlayer', value: activePlayer});
    }
    if (gameCount) {
      await Preferences.set({key: 'gameCount', value: gameCount});
    }
    if (playerCount) {
      await Preferences.set({key: 'playerCount', value: playerCount});
    }
    if (userPlayer) {
      await Preferences.set({key: 'userPlayer', value: userPlayer});
    }
  }

  async restoreFromBackup() {
    // fetch game data
    const games = await Preferences.get({key: 'games'});
    const players = await Preferences.get({key: 'players'});
    const settings = await Preferences.get({key: 'settings'});
    const rolls = await Preferences.get({key: 'rolls'});
    const activePlayer = await Preferences.get({key: 'activePlayer'});
    const gameCount = await Preferences.get({key: 'gameCount'});
    const playerCount = await Preferences.get({key: 'playerCount'});
    const userPlayer = await Preferences.get({key: 'userPlayer'});

    if (games.value) {
      for (const item of JSON.parse(games.value)) {
        await this.games.put(item, item.id);
      }
    }
    if (players.value) {
      for (const item of JSON.parse(players.value)) {
        await this.players.put(item, item.id);
      }
    }
    if (rolls.value) {
      for (const item of JSON.parse(rolls.value)) {
        await this.rolls.put(item, item.id);
      }
    }
    if (settings.value) {
      for (const item of JSON.parse(settings.value)) {
        await this.settings.put(item, item.id);
      }
    }
    if (activePlayer.value) {
      localStorage.setItem('activePlayer', activePlayer.value);
    }
    if (gameCount.value) {
      localStorage.setItem('gameCount', gameCount.value);
    }
    if (playerCount.value) {
      localStorage.setItem('playerCount', playerCount.value);
    }
    if (userPlayer.value) {
      localStorage.setItem('userPlayer', userPlayer.value);
    }
  }
}

export const db = new AppDb();
