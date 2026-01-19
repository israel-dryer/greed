import { Component, computed, inject, model } from '@angular/core';
import { GreedGame } from "../../../shared/types";
import { IonIcon, IonRippleEffect, IonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarClear, ellipse, ellipseOutline, timer } from "ionicons/icons";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { GameService } from "../../game.service";

@Component({
  selector: 'app-game-detail-card',
  templateUrl: './game-detail-card.component.html',
  styleUrls: ['./game-detail-card.component.scss'],
  imports: [
    IonIcon,
    IonText,
    DatePipe,
    IonRippleEffect
  ]
})
export class GameDetailCardComponent {

  game = model<GreedGame>();

  gameTurns = computed(() => this.formatGameTurns(this.game()));
  gameDuration = computed(() => this.formatGameDuration(this.game()));

  readonly gameService = inject(GameService);
  readonly router = inject(Router);

  constructor() {
    addIcons({ ellipse, ellipseOutline, calendarClear, timer });
  }

  formatGameTurns(game?: GreedGame) {
    if (!game) {
      return '0 turns';
    }
    const turns = game.turnNumber - 1;
    return turns.toLocaleString() + (turns === 1 ? ' turn' : ' turns');
  }

  formatGameDuration(game?: GreedGame) {
    if (!game) {
      return '0 mins';
    }
    const start = game.startedOn;
    const end = game.endedOn || Date.now();
    const minutes = Math.floor((end - start) / 1000 / 60);
    return minutes + ' mins';
  }

  async handleItemClicked() {
    const game = this.game();
    if (game) {
      await this.router.navigate(['game-detail'], { queryParams: { id: game.id } });
    }
  }

}
