import {Component, Input,} from '@angular/core';
import {Roll} from "../../../shared/types";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-game-rolls',
  templateUrl: './game-rolls.component.html',
  styleUrls: ['./game-rolls.component.scss'],
  imports: [
    NgIf
  ]
})
export class GameRollsComponent {

  @Input() isCitiesKnights = false;
  @Input() rolls: Roll[] = [];

}
