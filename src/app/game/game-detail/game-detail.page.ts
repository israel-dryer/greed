import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { GameService } from "../game.service";
import { ViewWillEnter } from '@ionic/angular';
import { GreedGame, Turn, RosterPlayer } from "../../shared/types";
import { ActivatedRoute, Router } from "@angular/router";
import { liveQuery } from "dexie";
import { StatisticsService } from "../../shared/statistics.service";
import { PlayService } from "../../play/play.service";
import Swiper from "swiper";

interface RoundGroup {
  roundNumber: number;
  turns: Turn[];
}

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.page.html',
  styleUrls: ['./game-detail.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonButton, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel,
    IonIcon, IonInput, IonList, IonItem, IonItemDivider, IonChip, IonText, IonFooter
  ]
})
export class GameDetailPage implements ViewWillEnter, OnInit, AfterViewInit {

  readonly swiperContainer = viewChild.required<ElementRef>('swiperContainer');
  game?: GreedGame;
  turns: Turn[] = [];
  roundGroups: RoundGroup[] = [];
  selectedSegment = 0;
  gameId?: number;

  readonly alertController = inject(AlertController);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly gameService = inject(GameService);
  readonly statisticService = inject(StatisticsService);
  readonly playService = inject(PlayService);

  async ngOnInit() {
    // Get game ID from route params or query params
    this.route.queryParams.subscribe(async params => {
      if (params['id']) {
        this.gameId = parseInt(params['id']);
        await this.loadGame();
      }
    });

    // Also check if there's an active game (for legacy support)
    if (!this.gameId) {
      const activeGame = await this.gameService.getActiveGame();
      if (activeGame) {
        this.gameId = activeGame.id;
        await this.loadGame();
      }
    }
  }

  async loadGame() {
    if (!this.gameId) return;

    this.game = await this.gameService.getGame(this.gameId);
    if (this.game) {
      this.turns = await this.gameService.getActiveTurnsByGameId(this.gameId);
      this.buildRoundGroups();
    }

    liveQuery(() => this.gameService.getGame(this.gameId!))
      .subscribe(async game => {
        this.game = game;
        if (game) {
          this.turns = await this.gameService.getActiveTurnsByGameId(game.id!);
          this.buildRoundGroups();
        }
      });
  }

  ngAfterViewInit() {
    this.swiperContainer().nativeElement.addEventListener('swiperslidechange', (e: any) => {
      this.selectedSegment = e.detail[0].activeIndex;
    });
  }

  async ionViewWillEnter() {
    if (this.gameId) {
      await this.loadGame();
    }
  }

  buildRoundGroups() {
    const groups = new Map<number, Turn[]>();
    for (const turn of this.turns) {
      if (!groups.has(turn.roundNumber)) {
        groups.set(turn.roundNumber, []);
      }
      groups.get(turn.roundNumber)!.push(turn);
    }

    this.roundGroups = Array.from(groups.entries())
      .map(([roundNumber, turns]) => ({ roundNumber, turns }))
      .sort((a, b) => b.roundNumber - a.roundNumber);
  }

  async deleteGame() {
    if (this.game) {
      const alert = await this.alertController.create({
        header: 'Delete Game?',
        message: 'Are you sure? This action cannot be undone!',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete', role: 'destructive' }
        ]
      });
      alert.onDidDismiss().then(async (result) => {
        if (result.role === 'destructive') {
          const playerIds = this.game!.playerIds;
          await this.gameService.deleteGame(this.game!.id!);
          for (const playerId of playerIds) {
            await this.statisticService.updatePlayerStatsById(playerId);
          }
          await this.router.navigate(['/tabs/home']);
        }
      });
      await alert.present();
    }
  }

  handleSegmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    (this.swiperContainer().nativeElement.swiper as Swiper).slideTo(event.detail.value);
  }

  getPlayerName(playerId: number): string {
    return this.game?.roster.find(p => p.id === playerId)?.name || 'Unknown';
  }

  getWinnerName(): string {
    if (!this.game?.winnerPlayerId) return 'No winner';
    return this.getPlayerName(this.game.winnerPlayerId);
  }

  formatNumber(value: number): string {
    return value.toLocaleString();
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  formatDuration(): string {
    if (!this.game) return '';
    const start = this.game.startedOn;
    const end = this.game.endedOn || Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  getOutcomeColor(outcome: string): string {
    switch (outcome) {
      case 'BANK': return 'success';
      case 'BUST': return 'danger';
      case 'PENALTY': return 'warning';
      default: return 'medium';
    }
  }

  getOutcomeLabel(turn: Turn): string {
    switch (turn.outcome) {
      case 'BANK': return `+${this.formatNumber(turn.deltaApplied)}`;
      case 'BUST': return 'BUST';
      case 'PENALTY': return 'PENALTY';
      default: return '';
    }
  }

  getSortedPlayers(): RosterPlayer[] {
    if (!this.game) return [];
    return [...this.game.roster].sort((a, b) => {
      const scoreA = this.game!.totals[a.id] ?? 0;
      const scoreB = this.game!.totals[b.id] ?? 0;
      return scoreB - scoreA;
    });
  }

  getStatusLabel(): string {
    if (!this.game) return '';
    switch (this.game.status) {
      case 'in_progress': return 'In Progress';
      case 'finished': return 'Finished';
      case 'abandoned': return 'Abandoned';
      default: return this.game.status;
    }
  }

  getStatusColor(): string {
    if (!this.game) return 'medium';
    switch (this.game.status) {
      case 'in_progress': return 'primary';
      case 'finished': return 'success';
      case 'abandoned': return 'warning';
      default: return 'medium';
    }
  }

  async continueGame() {
    if (this.game && (this.game.status === 'in_progress' || this.game.status === 'abandoned')) {
      // Reactivate abandoned games
      if (this.game.status === 'abandoned') {
        await this.gameService.updateGame(this.game.id!, { status: 'in_progress' });
        this.game.status = 'in_progress';
      }
      await this.playService.startGame(this.game);
      await this.router.navigate(['/playground']);
    }
  }
}
