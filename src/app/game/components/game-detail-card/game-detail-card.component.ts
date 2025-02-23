import {Component, inject, Input, OnInit} from '@angular/core';
import {Game} from "../../../shared/types";
import {IonIcon, IonRippleEffect, IonText} from "@ionic/angular/standalone";
import {addIcons} from "ionicons";
import {calendarClear, ellipse, dice, ellipseOutline, personCircle, timer} from "ionicons/icons";
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";
import {GameService} from "../../game.service";

@Component({
  selector: 'app-game-detail-card',
  templateUrl: './game-detail-card.component.html',
  styleUrls: ['./game-detail-card.component.scss'],
  imports: [
    IonIcon,
    IonText,
    DatePipe,
    IonRippleEffect
  ]
})
export class GameDetailCardComponent implements OnInit {

  @Input() game!: Game;

  gameTitle = 'Catan Classic';
  gameRolls = '0 rolls';
  gameDuration = '0 mins';

  readonly gameService = inject(GameService);
  readonly router = inject(Router);

  constructor() {
    addIcons({ellipse, dice, ellipseOutline, calendarClear, timer, personCircle})
  }

  ngOnInit() {
    // game title
    if (this.game.isCitiesKnights) {
      this.gameTitle = 'Cities & Knights';
    }
    if (this.game.isSeafarers) {
      if (this.game.isCitiesKnights) {
        this.gameTitle += ', Seafarers';
      } else {
        this.gameTitle = 'Seafarers';
      }
    }

    // game rolls
    this.gameRolls = this.game.rollCount.toLocaleString() + ' rolls';

    // game duration
    this.gameDuration = (this.game.duration / 60).toFixed(0) + ' mins';
  }

  async handleItemClicked() {
    this.gameService.setActiveGame(this.game);
    await this.router.navigate(['game-detail'])
  }

}
