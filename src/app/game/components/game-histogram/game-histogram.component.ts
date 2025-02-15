import {Component, Input, model, OnDestroy} from '@angular/core';
import {Game, Histogram, Roll} from "../../../shared/types";
import {IonChip, IonText} from "@ionic/angular/standalone";
import {NgClass, NgIf, NgStyle} from "@angular/common";
import {createHistogram} from "../../../shared/utilities";
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-game-histogram',
  templateUrl: './game-histogram.component.html',
  styleUrls: ['./game-histogram.component.scss'],
  imports: [
    IonChip,
    NgClass,
    NgStyle,
    NgIf,
    IonText
  ]
})
export class GameHistogramComponent implements OnDestroy {

  rolls = model.required<Roll[]>();
  game = model.required<Game>();

  rosterFilter: string[] = [];
  maxValue = 0;
  backgroundChart = true;
  baseHistogram!: Histogram;
  filteredHistogram!: Histogram;
  baseRolls: number[] = [];
  filteredRolls: number[] = [];
  roster: string[] = [];
  sub: any;

  constructor() {
    toObservable(this.rolls).subscribe(() => {
      this.roster = this.game().roster.map(x => x.name);
      this.buildBaseHistogram();
      this.buildFilteredHistogram();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  handleChipClicked(name: string) {

    if (this.rosterFilter.includes(name)) {
      this.rosterFilter = this.rosterFilter = [];
    } else {
      this.rosterFilter = [name];
    }
    this.buildFilteredHistogram();
  }

  buildBaseHistogram() {
    const histogram = createHistogram();
    for (const roll of this.rolls()) {
      histogram[roll.total] += 1;
    }
    this.baseHistogram = histogram;
    this.baseRolls = Object.values(histogram);
    this.maxValue = Math.max(...this.baseRolls);
  }

  buildFilteredHistogram() {
    const histogram = createHistogram();
    let rolls: Roll[];
    if (this.rosterFilter.length === 0) {
      this.filteredHistogram = this.baseHistogram;
      this.filteredRolls = this.baseRolls;
      return;
    } else {
      rolls = this.rolls().filter(x => this.rosterFilter.includes(x.playerName));
    }
    for (const roll of rolls) {
      histogram[roll.total] += 1;
    }
    this.filteredHistogram = histogram;
    this.filteredRolls = Object.values(histogram);
  }

}
