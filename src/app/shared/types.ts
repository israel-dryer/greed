export type Bool = 0 | 1;

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
  isRobber: Bool
}

export interface Game {
  id?: number;
  useFairDice: Bool;
  histogram: Histogram;
  lastRoll?: Roll;
  createdOn: number;
  completedOn?: number;
  duration: number;
  winnerId?: number;
  winnerName?: string;
  turnIndex: number;
  rollCount: number;
  barbarianCount: number;
  isSeafarers: Bool;
  isCitiesKnights: Bool;
  roster: RosterPlayer[];
}

export interface Settings {
  id?: number;
  rollingDice: Bool;
  robberLaugh: Bool;
  barbarianAttack: Bool;
  gameOver: Bool;
  fairDice: Bool;
  rollHaptics: Bool;
  rollAnnouncer: Bool;
}

export enum ActionDiceResult {
  RED = "Red",
  GRN = "Grn",
  BLU = "Blu",
  BAR = "Bar"
}
