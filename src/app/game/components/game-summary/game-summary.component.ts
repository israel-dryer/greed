import {Component, Input, OnInit} from '@angular/core';
import {Game} from "../../../shared/types";
import {IonInput, IonItem, IonLabel, IonList} from "@ionic/angular/standalone";
import {DatePipe, DecimalPipe, NgIf} from "@angular/common";
import {ConcatRosterPipe} from "../../../shared/concat-roster.pipe";

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
    DecimalPipe
  ]
})
export class GameSummaryComponent  implements OnInit {

  @Input() game!: Game;
  gameDuration = '';

  constructor() { }

  ngOnInit() {
    this.gameDuration = (this.game.duration / 60.0).toFixed(1) + ' minutes';
  }

}
