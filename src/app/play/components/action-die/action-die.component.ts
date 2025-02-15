import {Component, Input} from '@angular/core';
import {ActionDiceResult, ActionDiceImage} from "../../../shared/types";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-action-die',
  templateUrl: './action-die.component.html',
  styleUrls: ['./action-die.component.scss'],
  imports: [
    NgOptimizedImage
  ]
})
export class ActionDieComponent {

  constructor() { }

  @Input() action?: string;
  protected readonly ActionDiceResult = ActionDiceResult;
  protected readonly DiceActionResource = ActionDiceImage;

}
