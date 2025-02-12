import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonBackButton,
  IonButton, IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonInput,
  IonItem, IonLabel,
  IonList, IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {GameService} from "../game.service";
import {ViewWillEnter} from '@ionic/angular';
import {Game} from "../../shared/types";
import {ConcatRosterPipe} from "../../shared/concat-roster.pipe";
import {Router, RouterLink} from "@angular/router";
import {GameSummaryComponent} from "../components/game-summary/game-summary.component";
import {GameRollsComponent} from "../components/game-rolls/game-rolls.component";
import {GameHistogramComponent} from "../components/game-histogram/game-histogram.component";
import {addIcons} from "ionicons";
import {trash} from "ionicons/icons";

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.page.html',
  styleUrls: ['./game-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonInput, ConcatRosterPipe, IonButton, RouterLink, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonSegmentView, IonSegmentContent, GameSummaryComponent, GameRollsComponent, GameHistogramComponent, IonIcon]
})
export class GameDetailPage implements ViewWillEnter {

  activeGame?: Game;
  readonly router = inject(Router);
  readonly gameService = inject(GameService);

  constructor() {
    addIcons({trash});
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
