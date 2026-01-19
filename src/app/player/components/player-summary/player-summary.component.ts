import {Component, computed, input} from '@angular/core';
import {IonInput, IonItem, IonLabel, IonList} from "@ionic/angular/standalone";
import {Player} from "../../../shared/types";

@Component({
  selector: 'app-player-summary',
  templateUrl: './player-summary.component.html',
  styleUrls: ['./player-summary.component.scss'],
  imports: [
    IonList,
    IonItem,
    IonInput,
    IonLabel,
  ]
})
export class PlayerSummaryComponent {

  player = input.required<Player>();

  lastPlayed = computed(() => this.formatLastPlayed(this.player()));
  gamesPlayed = computed(() => this.player().gamesPlayed.toLocaleString());
  gamesWon = computed(() => this.player().gamesWon.toLocaleString());
  winRate = computed(() => this.formatWinRate(this.player()));
  turnsTaken = computed(() => this.player().turnsTaken.toLocaleString());
  totalBanked = computed(() => this.player().totalBanked.toLocaleString());
  avgBank = computed(() => this.formatAvgBank(this.player()));
  largestBank = computed(() => this.player().largestBank.toLocaleString());
  busts = computed(() => this.player().busts.toLocaleString());
  bustRate = computed(() => this.formatBustRate(this.player()));

  formatLastPlayed(player: Player): string {
    return player.lastPlayed === 0 ? 'Never' : new Date(player.lastPlayed).toLocaleString();
  }

  formatWinRate(player: Player): string {
    if (player.gamesPlayed === 0) return '0%';
    return (player.gamesWon / player.gamesPlayed).toLocaleString(undefined, {
      style: 'percent',
      maximumFractionDigits: 1
    });
  }

  formatAvgBank(player: Player): string {
    if (player.turnsTaken === 0) return '0';
    return Math.round(player.totalBanked / player.turnsTaken).toLocaleString();
  }

  formatBustRate(player: Player): string {
    if (player.turnsTaken === 0) return '0%';
    return (player.busts / player.turnsTaken).toLocaleString(undefined, {
      style: 'percent',
      maximumFractionDigits: 1
    });
  }
}
