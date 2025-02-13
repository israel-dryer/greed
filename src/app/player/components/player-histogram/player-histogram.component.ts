import {Component, Input, OnInit} from '@angular/core';
import {Histogram, Player} from "../../../shared/types";
import {NgClass,NgStyle} from "@angular/common";
import {IonText} from "@ionic/angular/standalone";

@Component({
  selector: 'app-player-histogram',
  templateUrl: './player-histogram.component.html',
  styleUrls: ['./player-histogram.component.scss'],
  imports: [
    NgStyle,
    NgClass,
    IonText
  ]
})
export class PlayerHistogramComponent implements OnInit {

  @Input() player!: Player;
  backgroundChart = false;
  histogram!: Histogram;
  rolls: number[] = [];
  maxValue = 0;

  ngOnInit() {
    this.histogram = this.player.histogram;
    this.rolls = Object.values(this.player.histogram);
    this.maxValue = Math.max(...this.rolls);
  }

}
