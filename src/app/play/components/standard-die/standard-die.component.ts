import {Component, Input, OnInit} from '@angular/core';
import {NgIf, NgStyle} from "@angular/common";

@Component({
  selector: 'app-standard-die',
  templateUrl: './standard-die.component.html',
  styleUrls: ['./standard-die.component.scss'],
  imports: [
    NgStyle,
    NgIf
  ]
})
export class StandardDieComponent  implements OnInit {

  @Input({ required: true }) number?: number;
  @Input({ required: true }) color?: 'red' | 'gold';
  @Input() showTapAlert = false;
  red: string = '';
  gold: string = '';
  dieColor = '';
  pipColor = '';

  ngOnInit() {
    this.red = getComputedStyle(document.documentElement).getPropertyValue(
      // '--ion-color-surface',
      '--ion-color-danger'
    );
    this.gold = getComputedStyle(document.documentElement).getPropertyValue(
      // '--ion-color-tertiary',
      '--ion-color-warning'
    );
    this.dieColor = this.color === 'red' ? this.red : this.gold;
    this.pipColor = this.color === 'red' ? this.gold : this.red;
  }

}
