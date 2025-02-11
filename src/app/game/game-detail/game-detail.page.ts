import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {GameService} from "../game.service";
import {ViewWillEnter} from '@ionic/angular';
import {Game} from "../../shared/types";
import {ConcatRosterPipe} from "../../shared/concat-roster.pipe";
import {Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.page.html',
  styleUrls: ['./game-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonInput, ConcatRosterPipe, IonButton, RouterLink]
})
export class GameDetailPage implements ViewWillEnter {

  activeGame?: Game;
  readonly router = inject(Router);
  readonly gameService = inject(GameService);

  constructor() {
  }

  ionViewWillEnter(): void {
    this.activeGame = this.gameService.getActiveGame();
  }

  async deleteGame() {
    if (this.activeGame) {
      this.gameService.deleteGame(this.activeGame.id!);
      await this.router.navigate(['/game-list']);
    }

  }

}
