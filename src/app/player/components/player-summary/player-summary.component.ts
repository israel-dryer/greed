import {Component, Input, OnInit} from '@angular/core';
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
export class PlayerSummaryComponent implements OnInit {

  // statistics
  lastPlayed = '';
  hoursPlayed = '';
  totalRolls = '';
  gamesPlayed = '';
  gamesWon = '';
  winRate = '';
  longestWinStreak = '';
  fastestWin = '';
  robberRate = '';

  @Input() player!: Player;


  ngOnInit() {
    this.formatStatistics();
  }

  formatStatistics() {
    if (this.player) {
      this.lastPlayed = this.player.lastPlayed === 0 ? 'Never' : new Date(this.player.lastPlayed).toLocaleString();
      this.hoursPlayed = ((this.player.secondsPlayed / 60) / 60).toFixed(1) + ' hours';
      this.totalRolls = this.player.totalRolls.toFixed(0);
      this.gamesPlayed = this.player.gamesPlayed.toFixed(0);
      this.gamesWon = this.player.gamesWon.toFixed(0);
      this.winRate = (this.player.gamesPlayed === 0 ? '0%' : (this.player.gamesWon / this.player.gamesPlayed).toLocaleString(undefined, {
        style: 'percent',
        maximumFractionDigits: 1
      }));
      this.longestWinStreak = this.player.longestWinsStreak.toFixed(0);
      this.fastestWin = (this.player.secondsPlayed / 60).toFixed(1) + ' minutes';
      this.robberRate = (this.player.totalRolls === 0 ? '0%' : (this.player.robberRolls / this.player.totalRolls).toLocaleString(undefined, {
        style: 'percent',
        maximumFractionDigits: 1
      }));
    }
  }

}
