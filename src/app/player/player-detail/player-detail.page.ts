import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {PlayerService} from "../player.service";
import {Player} from "../../shared/types";
import {addIcons} from "ionicons";
import {bookmark, bookmarkOutline} from "ionicons/icons";
import {Router} from "@angular/router";

@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.page.html',
  styleUrls: ['./player-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonIcon]
})
export class PlayerDetailPage implements OnInit {

  readonly router = inject(Router);
  readonly alertController = inject(AlertController);
  readonly playerService = inject(PlayerService);
  player?: Player

  ngOnInit(): void {
    addIcons({bookmark, bookmarkOutline})
    this.player = this.playerService.getActivePlayer();
  }

  async showEditPlayerNameDialog() {
    if (!this.player) return;

    const alert = await this.alertController.create({
      header: 'Edit Player Name',
      inputs: [{label: 'Name', type: 'text', name: 'playerName', value: this.player.name}],
      buttons: [{text: 'Submit', role: 'submit'}]
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
      : message += '\n\n Add bookmar to this player?'
    const alert = await this.alertController.create({
      header: 'Bookmark Player',
      message,
      buttons: [{text: 'Submit', role: 'submit'}]
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
