import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController, IonBackButton,
  IonButton, IonButtons,
  IonContent,
  IonHeader,
  IonIcon, IonInput, IonItem, IonLabel, IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {PlayerService} from "../player.service";
import {Player} from "../../shared/types";
import {addIcons} from "ionicons";
import {bookmark, bookmarkOutline, pencil, trash} from "ionicons/icons";
import {Router} from "@angular/router";

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.page.html',
  styleUrls: ['./player-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonIcon, IonButtons, IonBackButton, IonList, IonItem, IonLabel, IonInput]
})
export class PlayerDetailPage implements OnInit {

  readonly router = inject(Router);
  readonly alertController = inject(AlertController);
  readonly playerService = inject(PlayerService);
  player?: Player

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

  constructor() {
    addIcons({pencil, bookmark, bookmarkOutline, trash});
  }

  ngOnInit(): void {
    addIcons({bookmark, bookmarkOutline})
    this.player = this.playerService.getActivePlayer();
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

  async showEditPlayerNameDialog() {
    if (!this.player) return;

    const alert = await this.alertController.create({
      header: 'Edit Player Name',
      inputs: [{label: 'Name', type: 'text', name: 'playerName', value: this.player.name}],
      buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Submit', role: 'submit'}]
    });
    alert.onDidDismiss().then(async event => {
      if (event.role !== 'submit') {
        return
      }
      const name = event.data.values?.playerName;
      if (name && this.player) {
        await this.playerService.updatePlayer(this.player.id!, {name});
        this.player.name = name;
      }
    });
    await alert.present();
  }

  async showBookmarkPlayerDialog() {
    if (!this.player) return;
    const submitValue = this.player.isUser === 1 ? 0 : 1;
    let message = 'Bookmarking a player allows you to use the Personal Stats link in the Settings menu.'
    this.player.isUser === 1
      ? message += '\n\n Remove this bookmark?'
      : message += '\n\n Add bookmark to this player?'
    const alert = await this.alertController.create({
      header: 'Bookmark Player',
      message,
      buttons: [{text: 'Cancel', role: 'cancel'},{text: 'Submit', role: 'submit'}]
    });
    alert.onDidDismiss().then(async event => {
      if (event.role !== 'submit') {
        return
      }
      if (submitValue === 0 && this.player) {
        await this.playerService.bookmarkPlayer();
      } else {
        await this.playerService.bookmarkPlayer(this.player!.id!);
      }
      this.player!.isUser = submitValue;
    });
    await alert.present();
  }

  async showDeletePlayerDialog() {
    if (!this.player) return;
    let message = 'Historical records will remain but the player cannot be added to games and will not be visible in the players list. This action cannot be undone!';
    const alert = await this.alertController.create({
      header: 'Delete Player',
      message,
      buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Delete', role: 'destructive'}]
    });
    alert.onDidDismiss().then(async event => {
      if (event.role === 'destructive') {
        this.playerService.deactivatePlayer(this.player!.id!);
        this.router.navigate(['player-list']).then(() => this.playerService.resetActivePlayer());
      }
    });
    await alert.present();
  }

}
