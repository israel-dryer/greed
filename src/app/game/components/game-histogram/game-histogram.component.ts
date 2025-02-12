import {Component, Input, OnInit} from '@angular/core';
import {Game} from "../../../shared/types";

@Component({
  selector: 'app-game-histogram',
  templateUrl: './game-histogram.component.html',
  styleUrls: ['./game-histogram.component.scss'],
})
export class GameHistogramComponent  implements OnInit {

  @Input() game!: Game;

  constructor() { }

  ngOnInit() {}

}
