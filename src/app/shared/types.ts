export type Bool = 0 | 1;

// ===== GAME RULES (immutable per game) =====

export type OvershootPenaltyType = 'lose_full_bank' | 'lose_overshoot_only' | 'cap_at_target';

export interface GameRules {
  targetScore: number;              // default 10000
  mustHitExactly: boolean;          // default true
  overshootPenaltyType: OvershootPenaltyType; // default lose_full_bank
  onBoardThreshold: number;         // default 500
  allowCarryOverBank: boolean;      // default true
  minBank?: number | null;          // optional, default null
}

export const DEFAULT_GAME_RULES: GameRules = {
  targetScore: 10000,
  mustHitExactly: true,
  overshootPenaltyType: 'lose_full_bank',
  onBoardThreshold: 500,
  allowCarryOverBank: true,
  minBank: null,
};

// ===== PLAYER =====

export interface RosterPlayer {
  id: number;
  name: string;
}

export interface Player {
  id?: number;
  name: string;
  isUser: Bool;
  isActive: Bool;

  // Greed stats
  lastPlayed: number;
  gamesPlayed: number;
  gamesWon: number;
  turnsTaken: number;
  totalBanked: number;
  largestBank: number;
  busts: number;
  penalties: number;
  totalPenalty: number;
}

export const DEFAULT_PLAYER_STATS: Omit<Player, 'id' | 'name' | 'isUser' | 'isActive'> = {
  lastPlayed: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  turnsTaken: 0,
  totalBanked: 0,
  largestBank: 0,
  busts: 0,
  penalties: 0,
  totalPenalty: 0,
};

// ===== TURN =====

export type TurnOutcomeType = 'BANK' | 'BUST' | 'PENALTY';

export interface TurnScoreSegment {
  points: number;
  source: 'preset' | 'custom' | 'carry_over';
  label?: string;
  at: number;
}

export interface Turn {
  id?: number;
  gameId: number;

  turnNumber: number;             // global turn number (1-based)
  roundNumber: number;            // floor((turnNumber-1)/playerCount)+1

  playerId: number;
  playerIndex: number;
  endedAt: number;

  segments: TurnScoreSegment[];
  rollCount?: number | null;      // optional manual roll count

  turnPoints: number;             // sum of segments
  outcome: TurnOutcomeType;
  deltaApplied: number;           // BANK:+turnPoints, BUST:0, PENALTY:-amount

  totalBefore: number;
  totalAfter: number;
  onBoardBefore: boolean;
  onBoardAfter: boolean;

  flags?: {
    usedCarryOver?: boolean;
    triggeredOvershoot?: boolean;
    exceededTargetBy?: number;
  };

  voided?: { at: number; reason: 'undo' };
}

// ===== GAME =====

export type GameStatus = 'in_progress' | 'finished' | 'abandoned';

export interface LastBankInfo {
  playerId: number;
  amount: number;               // positive bank applied
  turnId: number;               // turns table id
  at: number;
}

export interface GreedGame {
  id?: number;
  createdOn: number;
  startedOn: number;
  endedOn?: number;
  status: GameStatus;

  rules: GameRules;               // snapshot at game creation
  playerIds: number[];            // roster order
  roster: RosterPlayer[];         // player info for display
  winnerPlayerId?: number | null;

  // Live state pointers
  currentPlayerIndex: number;     // whose turn (0-based)
  turnNumber: number;             // 1-based global turn counter

  // Current totals per player
  totals: Record<number, number>; // playerId -> total score
  onBoard: Record<number, boolean>; // playerId -> on board status

  lastBank?: LastBankInfo | null;
}

// ===== SETTINGS =====

export const DEFAULT_SCORE_PRESETS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 750, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000];

export interface Settings {
  id?: number;

  // New game default rules
  defaultRules: GameRules;

  // Score entry presets
  scorePresets: number[];

  // Display
  theme?: 'system' | 'light' | 'dark';
  numberFormat?: 'comma' | 'plain';
}

export const DEFAULT_SETTINGS: Omit<Settings, 'id'> = {
  defaultRules: DEFAULT_GAME_RULES,
  scorePresets: DEFAULT_SCORE_PRESETS,
  theme: 'system',
  numberFormat: 'comma',
};
