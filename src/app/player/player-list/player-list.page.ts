import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController, IonBackButton, IonButton, IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonItem,
  IonList, IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {liveQuery} from "dexie";
import {PlayerService} from "../player.service";
import {Player} from "../../shared/types";
import {Router} from "@angular/router";
import {addIcons} from "ionicons";
import {add, bookmark} from 'ionicons/icons'

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.page.html',
  styleUrls: ['./player-list.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonButton, IonButtons, IonBackButton, IonIcon, IonText]
})
export class PlayerListPage implements OnInit {

  alertController = inject(AlertController);
  playerService = inject(PlayerService);
  router = inject(Router);
  players: Player[] = [];

  constructor() {
    addIcons({add, bookmark})
  }

  ngOnInit() {
    liveQuery(() => this.playerService.getActivePlayers()).subscribe(
      players => this.players = players.sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async showCreatePlayerDialog() {

    const alert = await this.alertController.create({
      header: 'Create Player',
      inputs: [{placeholder: 'Name', type: 'text', name: 'playerName'}],
      buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Submit', role: 'submit'}]
    });
    alert.onDidDismiss().then(async event => {
      if (event.data.values.playerName) {
        await this.playerService.createPlayer(event.data.values.playerName);
      }
    });
    await alert.present();
  }

  async setupPlayerDetail(player: Player) {
    this.playerService.setActivePlayer(player);
    await this.router.navigate(['player-detail']);
  }

}
