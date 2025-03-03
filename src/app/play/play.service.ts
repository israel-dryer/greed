import {inject, Injectable, signal} from '@angular/core';
import {GameService} from "../game/game.service";
import {SettingsService} from '../settings/settings.service';
import {StatisticsService} from "../shared/statistics.service";
import {ActionDiceResult, Game, GameState, Roll, RosterPlayer, Settings} from "../shared/types";
import {TextToSpeech} from "@capacitor-community/text-to-speech";
import {Haptics, ImpactStyle} from "@capacitor/haptics";
import {db} from '../shared/database';
import {liveQuery} from "dexie";
import {AudioService} from "../shared/audio.service";

@Injectable({
  providedIn: 'root'
})
export class PlayService {

  // Services
  gameService = inject(GameService);
  settingsService = inject(SettingsService);
  statisticService = inject(StatisticsService);
  audioService = inject(AudioService);

  // Game properties
  activeGame = signal<Game | undefined>(undefined);
  activeGameRolls = signal<Roll[]>([]);
  settings = signal<Settings | undefined>(undefined);
  state = signal<GameState | undefined>(undefined);

  // Other
  diceTotal = signal<number|undefined>(undefined);
  barbariansAttack = signal(false);
  diceActionResult = signal<ActionDiceResult | undefined>(undefined);
  robberStealing = signal(false);
  isRolling = signal(false);

  constructor() {
    liveQuery(() => this.settingsService.getSettings())
      .subscribe(settings => {
        if (settings) this.settings.set(settings);
      });

    // set active game if screen is refreshed for some reason
    this.gameService.getActiveGame().then(async game => {
      if (game) {
        await this.startGame(game);
      }
    });
  }

  async startGame(game: Game) {
    this.activeGame.set(game);
    this.state.set(game.state);
    if (game.state.lastRoll) {
      this.diceTotal.set(game.state.lastRoll.total);
      this.diceActionResult.set(game.state.lastRoll.diceAction);
    }
    if (game.useFairDice === 1 && game.state.fairDiceCollection.length === 0) {
      this.generateFairDiceSet();
      await this.saveGameState();
    }
  }

  async saveGameState() {
    const game = this.activeGame();
    const state = this.state();
    if (game && state) {
      await this.gameService.updateGame(game!.id!, state);
    }
  }

  async updateLastRollData() {
    const game = this.activeGame();
    const state = this.state();
    if (game?.id && state) {
      const rolls = await this.gameService.getRollsByGameId(game.id);
      this.activeGameRolls.set(rolls);
      state.rollCount = rolls.length;
      state.lastRoll = this.activeGameRolls().at(-1);

      if (state.lastRoll) {
        state.prevPlayer = {id: state.lastRoll.playerId, name: state.lastRoll.playerName};
        state.prevIndex = state.lastRoll.turnIndex;
        state.dice1Result = state.lastRoll.dice1;
        state.dice2Result = state.lastRoll.dice2;
        this.diceTotal.set(state.lastRoll.total);
        this.diceActionResult.set(state.lastRoll.diceAction);
      }
      this.state.set(state);
      // await this.saveGameState();
    }
  }

  async endGame(winner?: RosterPlayer) {
    const game = this.activeGame();
    const state = this.state();
    const changes: Record<string, any> = {};

    if (game && state) {
      const playerIds = game.roster.map(x => x.id);
      const completedOn = new Date();
      const createdOn = new Date(game.createdOn);

      // mark changes
      changes['completedOn'] = completedOn.valueOf();
      changes['duration'] = (completedOn.getTime() - createdOn.getTime()) / 1000;
      if (winner) {
        changes['winnerId'] = winner.id;
        changes['winnerName'] = winner.name;
      }
      state.rollCount = this.activeGameRolls().length;
      changes['state'] = state;
      this.gameService.updateGame(game.id!, changes);
      for (const id of playerIds) {
        await this.statisticService.updatePlayerStatsById(id);
      }
      await db.backupData();
    }
  }

  // Dice Roll Functions

  async rollDice(alchemyDice?: { dice1: number, dice2: number }) {
    const game = this.activeGame();
    const state = this.state();
    if (!game || !state) return;

    const player = state.nextPlayer!;
    let roll: { dice1: number, dice2: number, action?: ActionDiceResult };

    if (alchemyDice !== undefined) {
      roll = {dice1: alchemyDice.dice1, dice2: alchemyDice.dice2};
    } else if (game.useFairDice === 1) {
      roll = this.nextFairDiceRoll()!
    } else {
      roll = this.nextStandardDiceRoll();
    }

    if (game.isCitiesKnights === 1) {
      roll.action = this.nextCitiesKnightsActionRoll();
      if (roll.action === ActionDiceResult.BARBARIAN) {
        state.barbarianCount++;
        if (state.barbarianCount > 6) {
          this.barbariansAttack.set(true);
          state.canShowRobber = true;
        }
      }
    }
    this.state.set(state);

    const lastRoll = await this.gameService.createRoll(
      game.id!,
      player.id,
      player.name,
      state.nextIndex,
      roll.dice1,
      roll.dice2,
      roll.action,
    );

    this.robberStealing.set((lastRoll.total === 7 && state.canShowRobber));
    this.updateNextTurnIndex();
    this.updateNextPlayer();

    // update game object
    const gameHistogram = game.histogram;
    gameHistogram[lastRoll.total] += 1;
    const duration = Math.floor((new Date().getTime() - new Date(game.createdOn).getTime()) / 1000)

    await this.updateLastRollData();

    const gameChanges = {
      histogram: gameHistogram,
      duration,
      state: this.state()
    }

    await this.gameService.updateGame(game.id!, gameChanges);
    const result = await this.gameService.getGame(game.id!);
    this.activeGame.set(result);
  }

  resetRobberStealing() {
    this.robberStealing.set(false);
  }


  nextStandardDiceRoll() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return {dice1, dice2};
  }

  generateFairDiceSet() {
    const state = this.state();
    if (!state) return;

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

    state.fairDiceCollection = nums
      .map((value) => ({value, sort: Math.random()}))
      .sort((a, b) => a.sort - b.sort)
      .map(({value}) => value);
    this.state.set(state);
  }

  nextFairDiceRoll() {
    const state = this.state();
    const game = this.activeGame();
    if (!state || !game) return;
    if (state.fairDiceCollection.length === 0) {
      this.generateFairDiceSet();
    }
    const [dice1, dice2] = state.fairDiceCollection.pop()!;
    return {dice1, dice2};
  }

  async undoLastRoll() {
    const game = this.activeGame();
    const state = this.state();
    if (!state || !game) return;
    if (!state.lastRoll) return;  // no rolls to reverse

    // update histogram
    const histogram = game.histogram;
    histogram[state.lastRoll.total] -= 1;

    // update roll counts
    if (state.lastRoll.diceAction === ActionDiceResult.BARBARIAN) {
      state.barbarianCount -= 1;
    }

    state.nextIndex = state.prevIndex ? state.prevIndex : 0;
    state.nextPlayer = state.prevPlayer;

    await this.gameService.deleteRoll(state.lastRoll.id!);
    const newLastRoll = await this.gameService.getLastRollByGameId(game.id!);
    if (newLastRoll) {
      state.prevIndex = newLastRoll.turnIndex;
      state.prevPlayer = {id: newLastRoll.playerId, name: newLastRoll.playerName};
      const changes = {
        state: state,
        histogram,
      }
      this.diceTotal.set(newLastRoll.total);
      await this.gameService.updateGame(game.id!, changes);
      const result = await this.gameService.getGame(game.id!);
      this.activeGame.set(result);
    }
    this.state.set(state);
    await this.updateLastRollData();
    await this.saveGameState();
    return newLastRoll;
  }

  updateNextPlayer() {
    const state = this.state();
    const game = this.activeGame();
    if (!game || !state) return;
    const roster = game.roster;
    const index = state.nextIndex;
    state.prevPlayer = Object.assign({}, state.nextPlayer);
    state.nextPlayer = roster[index];
    this.state.set(state);
  }

  updateNextTurnIndex() {
    const state = this.state();
    const game = this.activeGame();
    if (!state || !game) return;
    const curr = state.nextIndex;
    state.prevIndex = state.nextIndex;
    const length = game.roster.length;
    let next = curr + 1;
    if (next >= length) {
      state.nextIndex = 0;
    } else {
      state.nextIndex = next;
    }
    this.state.set(state);
  }

  // -- Sound Effects --

  async playSoundRollingDice() {
    if (!this.settings()!.soundEffects) return;
    try {
      await this.audioService.playSound('dice');
    } catch (e) {
      console.log(e);
    }
  }

  async playSoundRobberLaugh() {
    if (!this.settings()!.soundEffects) return;
    try {
      await this.audioService.playSound('robber');
    } catch (e) {
      console.log(e);
    }
  }


  async playSoundGameOver() {
    if (!this.settings()!.soundEffects) return;
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
    const game = this.activeGame();
    const state = this.state();
    if (game && state) {
      state.barbarianCount = 0;
      this.barbariansAttack.set(false);
      await this.saveGameState();
    }
    this.state.set(state);
  }

  async playSoundBarbarianAttack() {
    if (!this.settings()!.soundEffects) return;
    try {
      await this.audioService.playSound('barbarians');
    } catch (e) {
      console.log(e);
    }
  }

  async playAlchemyBubbles() {
    if (!this.settings()!.soundEffects) return;
    try {
      await this.audioService.playSound('alchemy');
    } catch (e) {
      console.log(e);
    }
  }

  async announceRollResult(value: string) {
    if (!this.settings()!.rollAnnouncer) return;
    await TextToSpeech.speak({text: value});
  }

  async useRollHaptic() {
    if (!this.settings()!.rollHaptics) return;
    await Haptics.impact({style: ImpactStyle.Medium});
  }

}
