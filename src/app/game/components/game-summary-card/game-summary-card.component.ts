import { Component, inject } from '@angular/core';
import { PlayerService } from "../../../player/player.service";
import { Player } from "../../../shared/types";
import { liveQuery } from "dexie";
import { IonIcon, IonLabel, IonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendar, gameController, trophy } from "ionicons/icons";
import { DatePipe } from "@angular/common";

@Component({
  selector: 'app-game-summary-card',
  templateUrl: './game-summary-card.component.html',
  styleUrls: ['./game-summary-card.component.scss'],
  imports: [
    IonIcon,
    IonText,
    IonLabel,
    DatePipe
  ]
})
export class GameSummaryCardComponent {

  totalWins = '0';
  totalGames = '0';
  lastPlayed = 0;

  readonly playerService = inject(PlayerService);
  player?: Player;

  constructor() {
    addIcons({ calendar, gameController, trophy });

    liveQuery(() => this.playerService.getUserPlayer())
      .subscribe(player => {
        this.player = player;
        if (player) {
          this.totalWins = player.gamesWon.toLocaleString();
          this.totalGames = player.gamesPlayed.toLocaleString();
          this.lastPlayed = player.lastPlayed;
        }
      });
  }

}
