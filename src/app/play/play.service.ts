import {inject, Injectable} from '@angular/core';
import {GameService} from "../game/game.service";
import {SettingsService} from '../settings/settings.service';
import {StatisticsService} from "../shared/statistics.service";
import {ActionDiceResult, Game, RosterPlayer} from "../shared/types";

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
  roster: RosterPlayer[] = [];
  nextIndex = 0;
  prevIndex = 0;
  nextPlayer: RosterPlayer | undefined;
  prevPlayer: RosterPlayer | undefined;
  fairDiceCollection: number[][] = [];
  alchemyDice1 = 1;
  alchemyDice2 = 1;
  dice1Result = 0;
  dice2Result = 0;
  diceTotal = 0;
  diceActionResult: ActionDiceResult | undefined;
  barbarianCount = 0;
  isCitiesKnights = false;
  useFairDice = false;
  barbariansAttack = false;
  robberStealing = false;
  canShowRobber = true;

  constructor() {
    // set active game if screen is refreshed for some reason
    const game = localStorage.getItem('activeGame');
    if (game) {
      const gameObject = JSON.parse(game) as Game;
      this.startGame(gameObject);
    }
  }

  startGame(game: Game) {
    this.activeGame = game;
    this.roster = game.roster;
    this.nextIndex = game.turnIndex;
    this.nextPlayer = game.roster[game.turnIndex];

    this.isCitiesKnights = game.isCitiesKnights === 1;
    this.canShowRobber = !(game.isCitiesKnights === 1);
    this.useFairDice = game.useFairDice === 1;
    if (this.useFairDice) {
      this.generateFairDiceSet();
    }
  }

  async endGame(winner?: RosterPlayer) {
    const changes: Record<string, any> = {};

    if (this.activeGame) {
      const completedOn = new Date();
      const createdOn = new Date(this.activeGame.createdOn);
      changes['completedOn'] = completedOn.valueOf();
      changes['duration'] = (completedOn.getTime() - createdOn.getTime()) / 1000;
      if (winner) {
        changes['winnerId'] = winner.id;
        changes['winnerName'] = winner.name;
      }
      this.gameService.updateGame(this.activeGame.id!, changes);
    }


    // reset game state
    this.activeGame = undefined;
    this.roster = [];
    this.nextIndex = 0;
    this.prevIndex = 0;
    this.nextPlayer = undefined;
    this.prevPlayer = undefined;
    this.isCitiesKnights = false;
    this.useFairDice = false;
    this.fairDiceCollection = [];
    this.alchemyDice1 = 1;
    this.alchemyDice2 = 1;
    this.dice1Result = 0;
    this.dice2Result = 0;
    this.diceTotal = 0;
    this.canShowRobber = true;
    this.barbarianCount = 0;
    this.barbariansAttack = false;
    this.diceActionResult = undefined;

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
      if (roll.action === ActionDiceResult.BAR) {
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
      roll.dice1,
      roll.dice2,
      roll.action,
    )

    this.robberStealing = (lastRoll.total === 7 && this.canShowRobber);

    this.dice1Result = roll.dice1;
    this.dice2Result = roll.dice2;
    this.diceTotal = roll.dice1 + roll.dice2;
    this.diceActionResult = roll.action;

    this.updateNextTurnIndex();
    this.updateNextPlayer();

    // update game object
    const gameHistogram = game.histogram;
    gameHistogram[lastRoll.total] += 1;
    const duration = Math.floor((new Date().getTime() - new Date(game.createdOn).getTime()) / 1000)

    const gameChanges = {
      lastRoll,
      turnIndex: this.nextIndex,
      rollCount: game.rollCount + 1,
      histogram: gameHistogram,
      duration,
      barbarianCount: this.barbarianCount,
    }
    console.log(gameChanges);
    await this.gameService.updateGame(game.id!, gameChanges);
    this.activeGame = await this.gameService.getGame(game.id!);
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
    const rollCount = this.activeGame.rollCount - 1;
    let barbarianCount = this.activeGame.barbarianCount;
    if (lastRoll.diceAction === ActionDiceResult.BAR) {
      barbarianCount -= 1;
    }

    this.nextIndex = this.prevIndex;
    this.nextPlayer = this.prevPlayer;

    await this.gameService.deleteRoll(lastRoll.id!);
    const newLastRoll = await this.gameService.getLastRollByGameId(this.activeGame?.id!);
    if (newLastRoll) {
      this.updatePrevTurnIndex();
      this.prevPlayer = {id: newLastRoll.playerId, name: newLastRoll.playerName};
      const changes = {
        lastRoll: newLastRoll,
        turnIndex: this.nextIndex,
        rollCount,
        histogram,
        barbarianCount,
      }
      this.diceTotal = newLastRoll.total;
      await this.gameService.updateGame(this.activeGame.id!, changes);
    }
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

  updatePrevTurnIndex() {
    const length = this.roster.length;
    let prev = this.nextIndex - 1;
    if (prev < 0) {
      this.prevIndex = length - 1;
    } else {
      this.prevIndex = prev;
    }
  }


  // -- Sound Effects --

  playSoundRollingDice() {
    console.log('Playing rolling dice sound');
  }

  playSoundRobberLaugh() {
    console.log('Playing robber sound');
  }


  playSoundGameOver() {
    console.log('Playing game over sound');
  }

  // --- Cities and Knights Expansion ---

  nextCitiesKnightsActionRoll() {
    const options = ['Bar', 'Gld', 'Bar', 'Blu', 'Bar', 'Grn'];
    const index = Math.floor(Math.random() * options.length);
    return options[index] as ActionDiceResult;
  }

  alchemyDiceRoll() {
    const dice1 = this.alchemyDice1;
    const dice2 = this.alchemyDice2;
    const action = this.nextCitiesKnightsActionRoll();
    return {dice1, dice2, action};
  }

  async resetBarbarians() {
    console.log('Resetting barbarians');
    if (this.activeGame) {
      this.barbarianCount = 0;
      await this.gameService.updateGame(this.activeGame.id!, {barbarianCount: 0});
      this.barbariansAttack = false;
    }
  }

  playSoundBarbarianAttack() {
    console.log('Playing barbarian attack sound');
  }


}
