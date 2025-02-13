import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonBackButton,
  IonButton, IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonLabel,
  IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {GameService} from "../game.service";
import {ViewWillEnter} from '@ionic/angular';
import {Game, Roll} from "../../shared/types";
import {ActivatedRoute, Router} from "@angular/router";
import {GameSummaryComponent} from "../components/game-summary/game-summary.component";
import {GameRollsComponent} from "../components/game-rolls/game-rolls.component";
import {GameHistogramComponent} from "../components/game-histogram/game-histogram.component";
import {addIcons} from "ionicons";
import {trash} from "ionicons/icons";
import {liveQuery} from "dexie";

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.page.html',
  styleUrls: ['./game-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonSegmentView, IonSegmentContent, GameSummaryComponent, GameRollsComponent, GameHistogramComponent, IonIcon]
})
export class GameDetailPage implements ViewWillEnter, OnInit {

  activeGame?: Game;
  rolls: Roll[] = [];
  showSummary = true;

  readonly activeRoute = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly gameService = inject(GameService);

  constructor() {
    addIcons({trash});
  }

  ngOnInit() {
    this.activeRoute.queryParamMap.subscribe(param => {
      this.showSummary = param.get('summary') !== 'false'
    });
    this.activeGame = this.gameService.getActiveGame();
    liveQuery(() => this.gameService.getRollsByGameId(this.activeGame!.id!))
      .subscribe(rolls => {
        const _rolls = rolls;
        // convert the id to a roll count then sort in reverse order.
        _rolls.forEach((r, index) => r.id = index + 1);
        _rolls.reverse();
        this.rolls = _rolls
      });
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
