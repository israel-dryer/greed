import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController, IonBackButton,
  IonButton, IonButtons,
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
import {ActivatedRoute, Router} from "@angular/router";
import {PlayerSummaryComponent} from "../components/player-summary/player-summary.component";


@Component({
  selector: 'app-player-detail',
  templateUrl: './player-detail.page.html',
  styleUrls: ['./player-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonIcon, IonButtons, IonBackButton, PlayerSummaryComponent]
})
export class PlayerDetailPage implements OnInit {

  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly alertController = inject(AlertController);
  readonly playerService = inject(PlayerService);
  player?: Player

  constructor() {
    this.route.queryParams.subscribe(async (params) => {
      const playerId = params['id'];
      console.log('playerId', playerId);
      if (playerId) {
        this.player = await this.playerService.getPlayer(parseInt(playerId));
      }
    });
  }

  ngOnInit(): void {
    addIcons({bookmark, bookmarkOutline})
    this.player = this.playerService.getActivePlayer();
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

  async showDeletePlayerDialog() {
    if (!this.player) return;
    let message = 'Are you sure? Historical stats remain, but this player can no longer play games. This action cannot be undone!';
    const alert = await this.alertController.create({
      header: 'Deactivate Player',
      message,
      buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Deactivate', role: 'destructive'}]
    });
    alert.onDidDismiss().then(async event => {
      if (event.role === 'destructive') {
        this.playerService.deactivatePlayer(this.player!.id!);
        this.router.navigate(['tabs', 'player-list']).then(() => this.playerService.resetActivePlayer());
      }
    });
    await alert.present();
  }

}
