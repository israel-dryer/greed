import {Component, inject, Input, OnInit} from '@angular/core';
import {GameService} from "../../game.service";
import {Roll} from "../../../shared/types";
import {liveQuery} from "dexie";
import {IonCol, IonGrid, IonRow} from "@ionic/angular/standalone";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-game-rolls',
  templateUrl: './game-rolls.component.html',
  styleUrls: ['./game-rolls.component.scss'],
  imports: [
    IonGrid,
    IonRow,
    IonCol,
    NgIf
  ]
})
export class GameRollsComponent  implements OnInit {

  @Input() gameId!: number;
  @Input() isCitiesKnights = false;
  readonly gameService = inject(GameService);
  rolls: Roll[] = [];


  ngOnInit() {
    liveQuery(() => this.gameService.getRollsByGameId(this.gameId))
      .subscribe(rolls => {
        const _rolls = rolls;
        // convert the id to a roll count then sort in reverse order.
        _rolls.forEach((r, index) => r.id = index + 1);
        _rolls.reverse();
        this.rolls = _rolls
      });
  }

}
