import {Component, inject, Input} from '@angular/core';
import {BreakpointObserver} from "@angular/cdk/layout";
import {map} from "rxjs/operators";
import {NgClass} from "@angular/common";
import {IonButton, IonIcon} from "@ionic/angular/standalone";

@Component({
  selector: 'app-barbarian-track',
  templateUrl: './barbarian-track.component.html',
  styleUrls: ['./barbarian-track.component.scss'],
  imports: [
    NgClass,
    IonIcon,
    IonButton
  ]
})
export class BarbarianTrackComponent {

  @Input() barbarianCount = 0;
  @Input() barbarianAttack = false;
  breakPointObserver = inject(BreakpointObserver);
  isDarkTheme$ = this.breakPointObserver.observe('(prefers-color-scheme: dark)').pipe(map((result) => result.matches));

  isActive(target: number) {
    if (this.barbarianCount >= target) {
      return true;
    }
    return this.barbarianAttack;
  }
}
