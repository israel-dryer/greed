export type Bool = 0 | 1;

export enum ActionDiceImage {
  BARBARIAN = 'assets/images/cities-knights-barbarian.svg',
  BLUE = 'assets/images/cities-knights-blue.svg',
  GOLD = 'assets/images/cities-knights-gold.svg',
  GREEN = 'assets/images/cities-knights-green.svg',
}

export interface Histogram {
  [index: number]: number;

  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
  10: number;
  11: number;
  12: number;
}

export interface Player {
  id?: number;
  name: string;
  isUser: Bool;
  isActive: Bool;
  histogram: Histogram;
  lastPlayed: number;
  gamesPlayed: number;
  gamesWon: number;
  secondsPlayed: number;
  fastestWinSeconds: number;
  longestWinsStreak: number;
  robberRolls: number;
  totalRolls: number;
}

export interface RosterPlayer {
  id: number;
  name: string;
}

export interface Roll {
  id?: number;
  gameId: number;
  playerId: number;
  playerName: string;
  diceAction?: ActionDiceResult;
  dice1: number;
  dice2: number;
  total: number;
  isRobber: Bool;
  turnIndex: number;
}

export interface GameState {
  rollCount: number;
  nextIndex: number;
  prevIndex: number | null;
  nextPlayer: RosterPlayer | undefined;
  prevPlayer: RosterPlayer | undefined;
  lastRoll: Roll | undefined;
  dice1Result: number;
  dice2Result: number;
  barbarianCount: number;
  canShowRobber: boolean;
  fairDiceCollection: number[][];
}

export interface Game {
  id?: number;
  useFairDice: Bool;
  histogram: Histogram;
  createdOn: number;
  completedOn?: number;
  duration: number;
  winnerId?: number;
  winnerName?: string;
  isSeafarers: Bool;
  isCitiesKnights: Bool;
  roster: RosterPlayer[];
  state: GameState;
}

export interface Settings {
  id?: number;
  fairDice: Bool;
  rollHaptics: Bool;
  rollAnnouncer: Bool;
  soundEffects: Bool;
}

export enum ActionDiceResult {
  BARBARIAN = "Bar",
  BLUE = "Blu",
  GREEN = "Grn",
  GOLD = "Gld"
}
