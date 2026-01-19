import { inject, Injectable, signal, computed } from '@angular/core';
import { GameService } from "../game/game.service";
import { SettingsService } from '../settings/settings.service';
import { StatisticsService } from "../shared/statistics.service";
import {
  GreedGame,
  Turn,
  TurnScoreSegment,
  TurnOutcomeType,
  Settings,
  RosterPlayer,
  GameStatus
} from "../shared/types";
import { liveQuery } from "dexie";

export interface BankPreview {
  turnPoints: number;
  newTotal: number;
  wouldOvershoot: boolean;
  exceededBy: number;
  penaltyApplied: number;
  finalTotal: number;
  outcome: TurnOutcomeType;
  wouldGetOnBoard: boolean;
  canBank: boolean;
  cantBankReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayService {

  // Services
  gameService = inject(GameService);
  settingsService = inject(SettingsService);
  statisticService = inject(StatisticsService);

  // Game state
  activeGame = signal<GreedGame | undefined>(undefined);
  turns = signal<Turn[]>([]);
  settings = signal<Settings | undefined>(undefined);

  // Draft state for current turn
  draftSegments = signal<TurnScoreSegment[]>([]);

  // Computed values
  draftTurnPoints = computed(() => {
    return this.draftSegments().reduce((sum, seg) => sum + seg.points, 0);
  });

  currentPlayer = computed<RosterPlayer | undefined>(() => {
    const game = this.activeGame();
    if (!game) return undefined;
    return game.roster[game.currentPlayerIndex];
  });

  currentPlayerTotal = computed(() => {
    const game = this.activeGame();
    const player = this.currentPlayer();
    if (!game || !player) return 0;
    return game.totals[player.id] ?? 0;
  });

  currentPlayerOnBoard = computed(() => {
    const game = this.activeGame();
    const player = this.currentPlayer();
    if (!game || !player) return false;
    return game.onBoard[player.id] ?? false;
  });

  // Carry-over availability
  carryOverAvailable = computed(() => {
    const game = this.activeGame();
    if (!game) return false;
    if (!game.rules.allowCarryOverBank) return false;
    if (!game.lastBank) return false;
    if (this.draftSegments().length > 0) return false; // Can only use carry-over as first action
    if (!this.currentPlayerOnBoard()) return false; // Must be on the board to use carry-over

    // Check if last bank was from a different player
    const currentPlayerId = this.currentPlayer()?.id;
    if (game.lastBank.playerId === currentPlayerId) return false;

    return game.lastBank.amount > 0;
  });

  carryOverAmount = computed(() => {
    const game = this.activeGame();
    if (!game?.lastBank) return 0;
    return game.lastBank.amount;
  });

  lastBankPlayer = computed(() => {
    const game = this.activeGame();
    if (!game?.lastBank) return undefined;
    return game.roster.find(p => p.id === game.lastBank!.playerId);
  });

  constructor() {
    liveQuery(() => this.settingsService.getSettings())
      .subscribe(settings => {
        if (settings) this.settings.set(settings);
      });

    // Restore active game if screen is refreshed
    this.gameService.getActiveGame().then(async game => {
      if (game && game.status === 'in_progress') {
        await this.startGame(game);
      }
    });
  }

  async startGame(game: GreedGame) {
    this.activeGame.set(game);
    this.draftSegments.set([]);

    // Load turns for this game
    const gameTurns = await this.gameService.getActiveTurnsByGameId(game.id!);
    this.turns.set(gameTurns);
  }

  // ===== Draft Management =====

  addPreset(points: number) {
    const segment: TurnScoreSegment = {
      points,
      source: 'preset',
      at: Date.now()
    };
    this.draftSegments.update(segments => [...segments, segment]);
  }

  addCustom(points: number) {
    const segment: TurnScoreSegment = {
      points,
      source: 'custom',
      at: Date.now()
    };
    this.draftSegments.update(segments => [...segments, segment]);
  }

  addCarryOver() {
    if (!this.carryOverAvailable()) return;

    const amount = this.carryOverAmount();
    const segment: TurnScoreSegment = {
      points: amount,
      source: 'carry_over',
      label: `Carry-over from ${this.lastBankPlayer()?.name}`,
      at: Date.now()
    };
    this.draftSegments.update(segments => [...segments, segment]);
  }

  removeLastSegment() {
    this.draftSegments.update(segments => segments.slice(0, -1));
  }

  clearDraft() {
    this.draftSegments.set([]);
  }

  // ===== Bank Preview =====

  getBankPreview(): BankPreview {
    const game = this.activeGame()!;
    const player = this.currentPlayer()!;
    const rules = game.rules;
    const turnPoints = this.draftTurnPoints();
    const currentTotal = this.currentPlayerTotal();
    const isOnBoard = this.currentPlayerOnBoard();
    const potentialTotal = currentTotal + turnPoints;

    let canBank = true;
    let cantBankReason: string | undefined;
    let outcome: TurnOutcomeType = 'BANK';
    let penaltyApplied = 0;
    let finalTotal = potentialTotal;
    let wouldOvershoot = false;
    let exceededBy = 0;
    let wouldGetOnBoard = false;

    // Check on-board gating
    if (!isOnBoard) {
      if (turnPoints < rules.onBoardThreshold) {
        canBank = false;
        cantBankReason = `Need ${rules.onBoardThreshold} to get on board`;
      } else {
        wouldGetOnBoard = true;
      }
    }

    // Check min bank requirement
    if (rules.minBank && turnPoints < rules.minBank) {
      canBank = false;
      cantBankReason = `Minimum bank is ${rules.minBank}`;
    }

    // Check overshoot
    if (rules.mustHitExactly && potentialTotal > rules.targetScore) {
      wouldOvershoot = true;
      exceededBy = potentialTotal - rules.targetScore;

      switch (rules.overshootPenaltyType) {
        case 'lose_full_bank':
          outcome = 'PENALTY';
          penaltyApplied = turnPoints;
          finalTotal = currentTotal; // No change
          break;
        case 'lose_overshoot_only':
          outcome = 'BANK';
          penaltyApplied = exceededBy;
          finalTotal = rules.targetScore; // Cap at target
          break;
        case 'cap_at_target':
          outcome = 'BANK';
          finalTotal = rules.targetScore;
          break;
      }
    }

    return {
      turnPoints,
      newTotal: potentialTotal,
      wouldOvershoot,
      exceededBy,
      penaltyApplied,
      finalTotal,
      outcome,
      wouldGetOnBoard,
      canBank,
      cantBankReason
    };
  }

  // ===== Finalize Actions =====

  async bank(): Promise<Turn | null> {
    const game = this.activeGame();
    const player = this.currentPlayer();
    if (!game || !player) return null;

    const preview = this.getBankPreview();
    if (!preview.canBank) return null;

    const turnPoints = preview.turnPoints;
    const segments = [...this.draftSegments()];
    const usedCarryOver = segments.some(s => s.source === 'carry_over');

    let deltaApplied: number;
    let outcome: TurnOutcomeType = preview.outcome;

    if (outcome === 'PENALTY') {
      deltaApplied = 0; // No change to total
    } else {
      deltaApplied = preview.finalTotal - this.currentPlayerTotal();
    }

    const turn = await this.createTurn(
      game,
      player,
      segments,
      turnPoints,
      outcome,
      deltaApplied,
      {
        usedCarryOver,
        triggeredOvershoot: preview.wouldOvershoot,
        exceededTargetBy: preview.exceededBy > 0 ? preview.exceededBy : undefined
      }
    );

    // Update game state
    const newTotals = { ...game.totals };
    newTotals[player.id] = preview.finalTotal;

    const newOnBoard = { ...game.onBoard };
    if (preview.wouldGetOnBoard || newOnBoard[player.id]) {
      newOnBoard[player.id] = true;
    }

    // Update lastBank only for positive banks
    let lastBank = game.lastBank;
    if (outcome === 'BANK' && deltaApplied > 0) {
      lastBank = {
        playerId: player.id,
        amount: deltaApplied,
        turnId: turn.id!,
        at: Date.now()
      };
    }

    await this.advanceTurn(game, newTotals, newOnBoard, lastBank);

    return turn;
  }

  async bust(): Promise<Turn | null> {
    const game = this.activeGame();
    const player = this.currentPlayer();
    if (!game || !player) return null;

    const turnPoints = this.draftTurnPoints();
    const segments = [...this.draftSegments()];

    const turn = await this.createTurn(
      game,
      player,
      segments,
      turnPoints,
      'BUST',
      0,
      {}
    );

    // Don't update lastBank on bust - it remains from previous bank
    await this.advanceTurn(game, game.totals, game.onBoard, game.lastBank);

    return turn;
  }

  private async createTurn(
    game: GreedGame,
    player: RosterPlayer,
    segments: TurnScoreSegment[],
    turnPoints: number,
    outcome: TurnOutcomeType,
    deltaApplied: number,
    flags: Turn['flags']
  ): Promise<Turn> {
    const totalBefore = game.totals[player.id] ?? 0;
    const totalAfter = totalBefore + deltaApplied;
    const onBoardBefore = game.onBoard[player.id] ?? false;
    const onBoardAfter = outcome === 'BANK' && (onBoardBefore || turnPoints >= game.rules.onBoardThreshold);

    const turn: Turn = {
      gameId: game.id!,
      turnNumber: game.turnNumber,
      roundNumber: Math.floor((game.turnNumber - 1) / game.playerIds.length) + 1,
      playerId: player.id,
      playerIndex: game.currentPlayerIndex,
      endedAt: Date.now(),
      segments,
      turnPoints,
      outcome,
      deltaApplied,
      totalBefore,
      totalAfter,
      onBoardBefore,
      onBoardAfter,
      flags: Object.keys(flags || {}).length > 0 ? flags : undefined
    };

    await this.gameService.addTurn(turn);
    this.turns.update(turns => [...turns, turn]);

    return turn;
  }

  private async advanceTurn(
    game: GreedGame,
    newTotals: Record<number, number>,
    newOnBoard: Record<number, boolean>,
    lastBank: GreedGame['lastBank']
  ) {
    const nextPlayerIndex = (game.currentPlayerIndex + 1) % game.playerIds.length;
    const nextTurnNumber = game.turnNumber + 1;

    const changes: Partial<GreedGame> = {
      currentPlayerIndex: nextPlayerIndex,
      turnNumber: nextTurnNumber,
      totals: newTotals,
      onBoard: newOnBoard,
      lastBank
    };

    await this.gameService.updateGame(game.id!, changes);
    const updatedGame = await this.gameService.getGame(game.id!);
    if (updatedGame) {
      this.activeGame.set(updatedGame);
      this.gameService.setActiveGame(updatedGame);
    }

    this.clearDraft();
  }

  // ===== Undo =====

  async undoLastTurn(): Promise<boolean> {
    const game = this.activeGame();
    if (!game) return false;

    const activeTurns = this.turns().filter(t => !t.voided);
    if (activeTurns.length === 0) return false;

    // Get the last non-voided turn
    const lastTurn = activeTurns.sort((a, b) => b.turnNumber - a.turnNumber)[0];

    // Void the turn
    await this.gameService.voidTurn(lastTurn.id!);

    // Recompute game state from remaining turns
    await this.recomputeGameState(game);

    return true;
  }

  private async recomputeGameState(game: GreedGame) {
    const activeTurns = await this.gameService.getActiveTurnsByGameId(game.id!);
    this.turns.set(activeTurns);

    // Reset totals and onBoard
    const totals: Record<number, number> = {};
    const onBoard: Record<number, boolean> = {};
    for (const playerId of game.playerIds) {
      totals[playerId] = 0;
      onBoard[playerId] = false;
    }

    // Replay all active turns
    let lastBank: GreedGame['lastBank'] = null;
    let currentPlayerIndex = 0;
    let turnNumber = 1;

    const sortedTurns = activeTurns.sort((a, b) => a.turnNumber - b.turnNumber);
    for (const turn of sortedTurns) {
      totals[turn.playerId] = turn.totalAfter;
      onBoard[turn.playerId] = turn.onBoardAfter;

      if (turn.outcome === 'BANK' && turn.deltaApplied > 0) {
        lastBank = {
          playerId: turn.playerId,
          amount: turn.deltaApplied,
          turnId: turn.id!,
          at: turn.endedAt
        };
      }

      currentPlayerIndex = (turn.playerIndex + 1) % game.playerIds.length;
      turnNumber = turn.turnNumber + 1;
    }

    const changes: Partial<GreedGame> = {
      totals,
      onBoard,
      lastBank,
      currentPlayerIndex,
      turnNumber
    };

    await this.gameService.updateGame(game.id!, changes);
    const updatedGame = await this.gameService.getGame(game.id!);
    if (updatedGame) {
      this.activeGame.set(updatedGame);
      this.gameService.setActiveGame(updatedGame);
    }

    this.clearDraft();
  }

  // ===== End Game =====

  async endGame(winnerPlayerId: number | null, status: GameStatus = 'finished') {
    const game = this.activeGame();
    if (!game) return;

    const changes: Partial<GreedGame> = {
      status,
      endedOn: Date.now(),
      winnerPlayerId
    };

    await this.gameService.updateGame(game.id!, changes);

    // Update player stats
    for (const playerId of game.playerIds) {
      await this.statisticService.updatePlayerStatsById(playerId);
    }

    // Clear active game
    this.gameService.setActiveGame(null);
    this.activeGame.set(undefined);
    this.turns.set([]);
    this.clearDraft();
  }

}
