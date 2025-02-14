import {Component, inject, Input, OnInit} from '@angular/core';
import {Game} from "../../../shared/types";
import {IonButton, IonInput, IonItem, IonLabel, IonList} from "@ionic/angular/standalone";
import {DatePipe, DecimalPipe, NgIf} from "@angular/common";
import {ConcatRosterPipe} from "../../../shared/concat-roster.pipe";
import {GameService} from "../../game.service";
import {Router} from "@angular/router";
import {PlayService} from "../../../play/play.service";

@Component({
  selector: 'app-game-summary',
  templateUrl: './game-summary.component.html',
  styleUrls: ['./game-summary.component.scss'],
  imports: [
    IonList,
    IonItem,
    IonInput,
    IonLabel,
    DatePipe,
    ConcatRosterPipe,
    NgIf,
    DecimalPipe,
    IonButton
  ]
})
export class GameSummaryComponent  implements OnInit {

  @Input() game!: Game;
  gameDuration = '';

  readonly gameService = inject(GameService);
  readonly playService = inject(PlayService);
  readonly router = inject(Router);

  constructor() { }

  ngOnInit() {
    this.gameDuration = (this.game.duration / 60.0).toFixed(1) + ' minutes';
  }

  async continueGame() {
    this.gameService.setActiveGame(this.game);
    this.playService.startGame(this.game);
    await this.router.navigate(['/playground']);
  }

}
