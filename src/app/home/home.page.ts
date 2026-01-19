import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonContent,
  IonButton,
  IonRouterLink,
  IonIcon,
  IonLabel,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  AlertController,
  IonCard,
  IonCardTitle,
  IonCardHeader,
  IonCardContent,
  IonList,
  IonItem
} from '@ionic/angular/standalone';
import { RouterLink } from "@angular/router";
import { GameListPage } from "../game/game-list/game-list.page";
import { GameSummaryCardComponent } from "../game/components/game-summary-card/game-summary-card.component";
import { liveQuery } from "dexie";
import { GameService } from "../game/game.service";
import { PlayerService } from "../player/player.service";
import { addIcons } from "ionicons";
import { checkbox, squareOutline, add, checkmark } from "ionicons/icons";
import { NgIf, CommonModule } from "@angular/common";
import { Player } from "../shared/types";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader, IonContent, IonButton, IonRouterLink, RouterLink, IonIcon,
    IonLabel, IonToolbar, IonTitle, IonBackButton, IonButtons, GameListPage,
    GameSummaryCardComponent, IonCard, IonCardTitle, IonCardHeader,
    IonCardContent, NgIf, IonList, IonItem, CommonModule
  ],
})
export class HomePage implements OnInit {

  playerCount = 0;
  gameCount = 0;
  userPlayer?: Player;

  constructor(
    gameService: GameService,
    private playerService: PlayerService,
    private alertController: AlertController
  ) {
    addIcons({ checkbox, squareOutline, add, checkmark });

    const _playerCount = localStorage.getItem('Greed.playerCount');
    if (_playerCount) {
      this.playerCount = parseInt(_playerCount);
    }
    const _gameCount = localStorage.getItem('Greed.gameCount');
    if (_gameCount) {
      this.gameCount = parseInt(_gameCount);
    }
    const _userPlayer = localStorage.getItem('Greed.userPlayer');
    if (_userPlayer) {
      this.userPlayer = JSON.parse(_userPlayer);
    }

    liveQuery(() => gameService.getGameCount())
      .subscribe(gameCount => {
        this.gameCount = gameCount;
        localStorage.setItem('Greed.gameCount', `${gameCount}`);
      });
    liveQuery(() => playerService.getPlayerCount())
      .subscribe(playerCount => {
        this.playerCount = playerCount;
        localStorage.setItem('Greed.playerCount', `${playerCount}`);
      });
    liveQuery(() => this.playerService.getUserPlayer())
      .subscribe(player => {
        this.userPlayer = player;
        if (this.userPlayer) {
          localStorage.setItem('Greed.userPlayer', JSON.stringify(this.userPlayer));
        }
      });
  }

  async ngOnInit() {
    await this.showCreateUserPlayerAlert();
  }

  async showCreateUserPlayerAlert() {
    const userPlayerFromDb = await this.playerService.getUserPlayer();
    if (userPlayerFromDb) {
      this.userPlayer = userPlayerFromDb;
      localStorage.setItem('Greed.userPlayer', JSON.stringify(userPlayerFromDb));
      return;
    }

    const createUserAlert = await this.alertController.create({
      header: 'Enter your player name',
      cssClass: 'sd-alert-message',
      backdropDismiss: false,
      message: '* required',
      inputs: [{ placeholder: 'Name', type: 'text', name: 'playerName', attributes: { maxLength: 10 } }],
    });

    const handler = async (data: any) => {
      if (data.playerName) {
        const name = data.playerName;
        const id = await this.playerService.createPlayer(name);
        await this.playerService.bookmarkPlayer(id);
        return true;
      }
      return false;
    };
    createUserAlert.buttons = [{ text: 'Submit', handler, role: 'submit' }];
    createUserAlert.onDidDismiss().then(async () => {
      if (!this.userPlayer) {
        await createUserAlert.present();
      }
    });
    if (!this.userPlayer) {
      await createUserAlert.present();
    }
  }

  async showCreateMoreUsersAlert() {
    if (this.playerCount > 1) {
      return;
    }
    const alert = await this.alertController.create({
      header: 'Create players',
      message: 'Two or more players are required. Click the "Players" tab below and create a few more players.',
      buttons: [{ text: 'Ok', role: 'submit' }]
    });
    await alert.present();
  }

  async showPlayGameAlert() {
    const alert = await this.alertController.create({
      header: 'Time to play',
      message: 'Click the "+ Start new game" button below to create a new game.',
      buttons: [{ text: 'Ok', role: 'submit' }]
    });
    await alert.present();
  }
}
