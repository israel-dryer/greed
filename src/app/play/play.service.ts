import {inject, Injectable, signal} from '@angular/core';
import {GameService} from "../game/game.service";
import {SettingsService} from '../settings/settings.service';
import {StatisticsService} from "../shared/statistics.service";
import {ActionDiceResult, Game, Roll, RosterPlayer, Settings} from "../shared/types";
import {NativeAudio} from '@capgo/native-audio'
import {TextToSpeech} from "@capacitor-community/text-to-speech";
import {Haptics, ImpactStyle} from "@capacitor/haptics";

@Injectable({
  providedIn: 'root'
})
export class PlayService {

  // Services
  gameService = inject(GameService);
  settingsService = inject(SettingsService);
  statisticService = inject(StatisticsService);

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

  alchemyDice1 = 1;
  alchemyDice2 = 1;

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
    this.settingsService.getSettings().then((settings) => {
      this.settings = settings!;
    });

    // set active game if screen is refreshed for some reason
    this.gameService.getActiveGame().then(async game => {
      if (game) {
        await this.startGame(game);
      }
    });
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
      console.log(game);
      this.roster = game.roster;
      this.nextIndex = game.turnIndex;
      this.nextPlayer = game.roster[game.turnIndex];
      this.barbarianCount = game.barbarianCount;

      this.isCitiesKnights = game.isCitiesKnights === 1;
      this.canShowRobber = !(game.isCitiesKnights === 1);
      this.useFairDice = game.useFairDice === 1;
      console.log('Barbarian Count initialized', this.barbarianCount);
      // this will cause the fair dice to reset if continuing an existing game.
      if (this.useFairDice) {
        this.generateFairDiceSet();
      }
    }
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
    }
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
    console.log('Current roll count', this.rollCount);
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
    console.log('Final roll count', this.rollCount, this.activeGame?.rollCount);
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
    if (!this.settings.rollingDice) return;
    try {
      await NativeAudio.play({assetId: 'rolling-dice'});
    } catch (e) {
      console.log(e);
    }
  }

  async playSoundRobberLaugh() {
    if (!this.settings.robberLaugh) return;
    try {
      await NativeAudio.play({assetId: 'robber-laugh'});
    } catch (e) {
      console.log(e);
    }
  }


  async playSoundGameOver() {
    if (!this.settings.gameOver) return;
    try {
      await NativeAudio.play({assetId: 'game-over'});
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
    console.log('Resetting barbarians');
    if (this.activeGame) {
      this.barbarianCount = 0;
      await this.gameService.updateGame(this.activeGame.id!, {barbarianCount: 0});
      this.barbariansAttack = false;
    }
  }

  async playSoundBarbarianAttack() {
    if (!this.settings.barbarianAttack) return;
    try {
      await NativeAudio.play({assetId: 'barbarian-attack'});
    } catch (e) {
      console.log(e);
    }
  }

  async playAlchemyBubbles() {
    if (!this.settings.alchemyBubbles) return;
    try {
      await NativeAudio.play({assetId: 'bubbles'});
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
    await Haptics.impact({style: ImpactStyle.Heavy});
  }

}
