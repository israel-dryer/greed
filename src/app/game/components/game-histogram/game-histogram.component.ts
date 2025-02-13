import {Component, Input, OnInit} from '@angular/core';
import {Game, Histogram, Roll} from "../../../shared/types";
import {IonChip} from "@ionic/angular/standalone";
import {NgClass, NgIf, NgStyle} from "@angular/common";
import {createHistogram} from "../../../shared/utilities";

@Component({
  selector: 'app-game-histogram',
  templateUrl: './game-histogram.component.html',
  styleUrls: ['./game-histogram.component.scss'],
  imports: [
    IonChip,
    NgClass,
    NgStyle,
    NgIf
  ]
})
export class GameHistogramComponent implements OnInit {

  @Input() rolls: Roll[] = [];
  @Input() game!: Game;

  rosterFilter: string[] = [];
  baseHistogram!: Histogram;
  maxValue = 0;
  backgroundChart = true;
  filteredHistogram!: Histogram;
  baseRolls: number[] = [];
  filteredRolls: number[] = [];
  roster: string[] = [];

  ngOnInit() {
    this.roster = this.game.roster.map(x => x.name);
    this.baseHistogram = this.game.histogram;
    this.baseRolls = Object.values(this.baseHistogram);
    this.maxValue = Math.max(...this.baseRolls);
    console.log(this.filteredHistogram, this.filteredRolls);
    this.buildFilteredHistogram();
    console.log(this.filteredHistogram);
    console.log(this.filteredRolls);
  }

  handleChipClicked(name: string) {

    if (this.rosterFilter.includes(name)) {
      this.rosterFilter = this.rosterFilter = [];
    } else {
      this.rosterFilter = [name];
    }
    this.buildFilteredHistogram();
  }

  buildFilteredHistogram() {
    const histogram = createHistogram();
    if (this.rosterFilter.length === 0) {
      this.filteredHistogram = this.baseHistogram;
      this.filteredRolls = this.baseRolls;
      return;
    }
    const data = this.rolls.filter(x => this.rosterFilter.includes(x.playerName));
    for (const d of data) {
      histogram[d.total] += 1;
    }
    this.filteredHistogram = histogram;
    this.filteredRolls = Object.values(histogram);
  }

}
