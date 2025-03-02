import {inject, Injectable, signal} from '@angular/core';
import {GameService} from "../game/game.service";
import {SettingsService} from '../settings/settings.service';
import {StatisticsService} from "../shared/statistics.service";
import {ActionDiceResult, Game, Roll, RosterPlayer, Settings} from "../shared/types";
import {TextToSpeech} from "@capacitor-community/text-to-speech";
import {Haptics, ImpactStyle} from "@capacitor/haptics";
import {db} from '../shared/database';
import {liveQuery} from "dexie";
import {AudioService} from "../shared/audio.service";

interface GameState {
  rollCount: number;
  nextIndex: number;
  prevIndex: number;
  nextPlayer: RosterPlayer | undefined;
  prevPlayer: RosterPlayer | undefined;
  lastRoll: Roll | undefined;
  dice1Result: number;
  dice2Result: number;
  barbarianCount: number;
  isCitiesKnights: boolean;
  settings: Settings;
  barbariansAttack: boolean;
  robberStealing: boolean;
  canShowRobber: boolean;
  roster: RosterPlayer[];
  activeGame: Game | undefined;
  activeGameRolls: Roll[];
  fairDiceCollection: number[][];
}

@Injectable({
  providedIn: 'root'
})
export class PlayService {

  // Services
  gameService = inject(GameService);
  settingsService = inject(SettingsService);
  statisticService = inject(StatisticsService);
  audioService = inject(AudioService);

  // Game State
  activeGame: Game | undefined;
  activeGameRolls: Roll[] = [];

  roster: RosterPlayer[] = [];
  fairDiceCollection: number[][] = [];

  rollCount = 0;
  nextIndex = 0;
  prevIndex = 0;
  nextPlayer: RosterPlayer | undefined;
  prevPlayer: RosterPlayer | undefined;

  // dice results
  lastRoll: Roll | undefined;
  dice1Result = 0;
  dice2Result = 0;
  diceTotal = 0;
  diceActionResult: ActionDiceResult | undefined;

  // general state
  barbarianCount = 0;
  isCitiesKnights = false;
  settings!: Settings;

  useFairDice = false;
  barbariansAttack = false;
  robberStealing = false;
  canShowRobber = true;
  isRolling = signal(false);

  constructor() {
    liveQuery(() => this.settingsService.getSettings())
      .subscribe(settings => {
        if (settings) this.settings = settings;
      });

    // set active game if screen is refreshed for some reason
    this.gameService.getActiveGame().then(async game => {
      if (game) {
        await this.startGame(game);
      }
    });
  }

  saveGameState() {
    const gameCache = {
      rollCount: this.rollCount,
      nextIndex: this.nextIndex,
      prevIndex: this.prevIndex,
      nextPlayer: this.nextPlayer,
      prevPlayer: this.prevPlayer,
      lastRoll: this.lastRoll,
      dice1Result: this.dice1Result,
      dice2Result: this.dice2Result,
      barbarianCount: this.barbarianCount,
      isCitiesKnights: this.isCitiesKnights,
      barbariansAttack: this.barbariansAttack,
      robberStealing: this.robberStealing,
      canShowRobber: this.canShowRobber,
      roster: this.roster,
      activeGame: this.activeGame,
      activeGameRolls: this.activeGameRolls,
      fairDiceCollection: this.fairDiceCollection,
    }
    localStorage.setItem('SettlersDice.activeGameState', JSON.stringify(gameCache));
  }

  restoreGameState() {
    const cache = localStorage.getItem('SettlersDice.activeGameState');
    if (cache) {
      const state = JSON.parse(cache) as GameState;
      this.rollCount = state.rollCount;
      this.nextIndex = state.nextIndex;
      this.prevIndex = state.prevIndex;
      this.nextPlayer = state.nextPlayer;
      this.prevPlayer = state.prevPlayer;
      this.lastRoll = state.lastRoll;
      this.dice1Result = state.dice1Result;
      this.dice2Result = state.dice2Result;
      this.barbarianCount = state.barbarianCount;
      this.isCitiesKnights = state.isCitiesKnights;
      this.barbarianCount = state.barbarianCount;
      this.robberStealing = state.robberStealing;
      this.canShowRobber = state.canShowRobber;
      this.roster = state.roster;
      this.activeGame = state.activeGame;
      this.activeGameRolls = state.activeGameRolls;
      this.fairDiceCollection = state.fairDiceCollection;
    }
  }

  resetGameState() {
    localStorage.removeItem('SettlersDice.activeGameState');
  }

  async startGame(game: Game) {
    this.activeGame = game;
    await this.initializeGameData();
    await this.updateLastRollData();
  }

  async updateLastRollData() {
    if (this.activeGame?.id) {
      this.activeGameRolls = await this.gameService.getRollsByGameId(this.activeGame.id);
      this.rollCount = this.activeGameRolls.length;
    }
    this.lastRoll = this.activeGameRolls.at(-1);
    if (this.lastRoll) {
      this.prevPlayer = {id: this.lastRoll.playerId, name: this.lastRoll.playerName};
      this.prevIndex = this.lastRoll.turnIndex;
      this.diceTotal = this.lastRoll.total;
      this.dice1Result = this.lastRoll.dice1;
      this.dice2Result = this.lastRoll.dice2;
      this.diceActionResult = this.lastRoll.diceAction;
    }
  }

  async initializeGameData() {
    const game = this.activeGame;
    if (game) {
      this.roster = game.roster;
      this.nextIndex = game.turnIndex;
      this.nextPlayer = game.roster[game.turnIndex];
      this.barbarianCount = game.barbarianCount;

      this.isCitiesKnights = game.isCitiesKnights === 1;
      this.canShowRobber = !(game.isCitiesKnights === 1);
      this.useFairDice = game.useFairDice === 1;

      if (this.useFairDice) {
        this.generateFairDiceSet();
      }
    }
    // restore state if existing
    this.restoreGameState();

  }

  async endGame(winner?: RosterPlayer) {
    const changes: Record<string, any> = {};

    if (this.activeGame) {
      const playerIds = this.activeGame.roster.map(x => x.id);
      const completedOn = new Date();
      const createdOn = new Date(this.activeGame.createdOn);
      changes['completedOn'] = completedOn.valueOf();
      changes['duration'] = (completedOn.getTime() - createdOn.getTime()) / 1000;
      changes['rollCount'] = this.rollCount;
      if (winner) {
        changes['winnerId'] = winner.id;
        changes['winnerName'] = winner.name;
      }
      this.gameService.updateGame(this.activeGame.id!, changes);
      for (const id of playerIds) {
        await this.statisticService.updatePlayerStatsById(id);
      }
      await db.backupData();
    }
    this.resetGameState();
  }

  // Dice Roll Functions

  async rollDice(alchemyDice?: { dice1: number, dice2: number }) {
    const player = this.nextPlayer!;
    const game = this.activeGame!;

    let roll: { dice1: number, dice2: number, action?: ActionDiceResult };

    if (alchemyDice !== undefined) {
      roll = {dice1: alchemyDice.dice1, dice2: alchemyDice.dice2};
    } else if (this.useFairDice) {
      roll = this.nextFairDiceRoll()
    } else {
      roll = this.nextStandardDiceRoll();
    }

    if (this.isCitiesKnights) {
      roll.action = this.nextCitiesKnightsActionRoll();
      if (roll.action === ActionDiceResult.BARBARIAN) {
        this.barbarianCount++;
        if (this.barbarianCount > 6) {
          this.barbariansAttack = true;
          this.canShowRobber = true;
        }
      }
    }

    const lastRoll = await this.gameService.createRoll(
      game.id!,
      player.id,
      player.name,
      game.turnIndex,
      roll.dice1,
      roll.dice2,
      roll.action,
    )

    this.robberStealing = (lastRoll.total === 7 && this.canShowRobber);

    this.updateNextTurnIndex();
    this.updateNextPlayer();

    // update game object
    const gameHistogram = game.histogram;
    gameHistogram[lastRoll.total] += 1;
    const duration = Math.floor((new Date().getTime() - new Date(game.createdOn).getTime()) / 1000)

    const gameChanges = {
      lastRoll,
      turnIndex: this.nextIndex,
      rollCount: this.rollCount,
      histogram: gameHistogram,
      duration,
      barbarianCount: this.barbarianCount,
    }
    await this.gameService.updateGame(game.id!, gameChanges);
    this.activeGame = await this.gameService.getGame(game.id!);
    await this.updateLastRollData();
    this.saveGameState();
  }

  resetRobberStealing() {
    this.robberStealing = false;
  }


  nextStandardDiceRoll() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return {dice1, dice2};
  }

  generateFairDiceSet() {
    let i = 1;
    let j = 1;
    const nums = [];

    while (i < 7) {
      while (j < 7) {
        nums.push([i, j]);
        j++;
      }
      j = 1;
      i++;
    }

    this.fairDiceCollection = nums
      .map((value) => ({value, sort: Math.random()}))
      .sort((a, b) => a.sort - b.sort)
      .map(({value}) => value);
  }

  nextFairDiceRoll() {
    if (this.fairDiceCollection.length === 0) {
      this.generateFairDiceSet();
    }
    const [dice1, dice2] = this.fairDiceCollection.pop()!;
    return {dice1, dice2};
  }

  async undoLastRoll() {
    if (!this.activeGame?.lastRoll) return;  // no rolls to reverse
    const lastRoll = this.activeGame.lastRoll;
    // update histogram
    const histogram = this.activeGame.histogram;
    histogram[lastRoll.total] -= 1;

    // update roll counts
    let barbarianCount = this.activeGame.barbarianCount;
    if (lastRoll.diceAction === ActionDiceResult.BARBARIAN) {
      barbarianCount -= 1;
    }

    this.nextIndex = this.prevIndex;
    this.nextPlayer = this.prevPlayer;

    await this.gameService.deleteRoll(lastRoll.id!);
    const newLastRoll = await this.gameService.getLastRollByGameId(this.activeGame?.id!);
    if (newLastRoll) {
      this.prevIndex = newLastRoll.turnIndex;
      this.prevPlayer = {id: newLastRoll.playerId, name: newLastRoll.playerName};
      const changes = {
        lastRoll: newLastRoll,
        turnIndex: this.nextIndex,
        rollCount: this.rollCount,
        histogram,
        barbarianCount,
      }
      this.diceTotal = newLastRoll.total;
      await this.gameService.updateGame(this.activeGame.id!, changes);
      this.activeGame = await this.gameService.getGame(this.activeGame.id!);
    }
    await this.updateLastRollData();
    this.saveGameState();
    return newLastRoll;
  }

  updateNextPlayer() {
    const roster = this.roster;
    const index = this.nextIndex;
    this.prevPlayer = Object.assign({}, this.nextPlayer);
    this.nextPlayer = roster[index];
  }

  updateNextTurnIndex() {
    const curr = this.nextIndex;
    this.prevIndex = this.nextIndex;
    const length = this.roster.length;
    let next = curr + 1;
    if (next >= length) {
      this.nextIndex = 0;
    } else {
      this.nextIndex = next;
    }
  }

  // -- Sound Effects --

  async playSoundRollingDice() {
    if (!this.settings.soundEffects) return;
    try {
      await this.audioService.playSound('dice');
    } catch (e) {
      console.log(e);
    }
  }

  async playSoundRobberLaugh() {
    if (!this.settings.soundEffects) return;
    try {
      await this.audioService.playSound('robber');
    } catch (e) {
      console.log(e);
    }
  }


  async playSoundGameOver() {
    if (!this.settings.soundEffects) return;
    try {
      await this.audioService.playSound('gameOver');
    } catch (e) {
      console.log(e);
    }
  }

  // --- Cities and Knights Expansion ---

  nextCitiesKnightsActionRoll() {
    const options = ['Bar', 'Gld', 'Bar', 'Blu', 'Bar', 'Grn'];
    const index = Math.floor(Math.random() * options.length);
    return options[index] as ActionDiceResult;
  }

  async resetBarbarians() {
    if (this.activeGame) {
      this.barbarianCount = 0;
      await this.gameService.updateGame(this.activeGame.id!, {barbarianCount: 0});
      this.barbariansAttack = false;
    }
  }

  async playSoundBarbarianAttack() {
    if (!this.settings.soundEffects) return;
    try {
      await this.audioService.playSound('barbarians');
    } catch (e) {
      console.log(e);
    }
  }

  async playAlchemyBubbles() {
    if (!this.settings.soundEffects) return;
    try {
      await this.audioService.playSound('alchemy');
    } catch (e) {
      console.log(e);
    }
  }

  async announceRollResult(value: string) {
    if (!this.settings.rollAnnouncer) return;
    await TextToSpeech.speak({text: value});
  }

  async useRollHaptic() {
    if (!this.settings.rollHaptics) return;
    await Haptics.impact({style: ImpactStyle.Medium});
  }

}
