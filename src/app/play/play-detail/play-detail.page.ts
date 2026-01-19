import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
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

import { ViewWillEnter } from '@ionic/angular';
import { GreedGame, Turn, RosterPlayer } from "../../shared/types";
import { Router } from "@angular/router";
import { liveQuery } from "dexie";
import { GameService } from "../../game/game.service";
import { calculateRoundNumber } from "../../shared/utilities";
import Swiper from "swiper";

interface RoundGroup {
  roundNumber: number;
  turns: Turn[];
}

@Component({
  selector: 'app-play-detail',
  templateUrl: './play-detail.page.html',
  styleUrls: ['./play-detail.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonItemDivider, IonChip, IonText, IonIcon
  ]
})
export class PlayDetailPage implements ViewWillEnter, OnInit, AfterViewInit {

  readonly swiperContainer = viewChild.required<ElementRef>('swiperContainer');
  readonly calculateRound = calculateRoundNumber;
  activeGame?: GreedGame;
  turns: Turn[] = [];
  roundGroups: RoundGroup[] = [];
  selectedSegment = 0;

  readonly router = inject(Router);
  readonly gameService = inject(GameService);

  async ngOnInit() {
    this.activeGame = await this.gameService.getActiveGame();
    if (this.activeGame) {
      this.turns = await this.gameService.getActiveTurnsByGameId(this.activeGame.id!);
      this.buildRoundGroups();
    }

    liveQuery(() => this.gameService.getActiveGame())
      .subscribe(async game => {
        this.activeGame = game;
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
    this.activeGame = await this.gameService.getActiveGame();
    if (this.activeGame) {
      this.turns = await this.gameService.getActiveTurnsByGameId(this.activeGame.id!);
      this.buildRoundGroups();
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

  handleSegmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    (this.swiperContainer().nativeElement.swiper as Swiper).slideTo(event.detail.value);
  }

  getPlayerName(playerId: number): string {
    return this.activeGame?.roster.find(p => p.id === playerId)?.name || 'Unknown';
  }

  formatNumber(value: number): string {
    return value.toLocaleString();
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
      case 'PENALTY': return `PENALTY`;
      default: return '';
    }
  }

  getSortedPlayers(): RosterPlayer[] {
    if (!this.activeGame) return [];
    return [...this.activeGame.roster].sort((a, b) => {
      const scoreA = this.activeGame!.totals[a.id] ?? 0;
      const scoreB = this.activeGame!.totals[b.id] ?? 0;
      return scoreB - scoreA;
    });
  }
}
