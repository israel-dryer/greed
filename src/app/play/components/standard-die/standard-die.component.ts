import {Component, Input, OnInit} from '@angular/core';
import {NgStyle} from "@angular/common";

@Component({
  selector: 'app-standard-die',
  templateUrl: './standard-die.component.html',
  styleUrls: ['./standard-die.component.scss'],
  imports: [
    NgStyle
  ]
})
export class StandardDieComponent  implements OnInit {

  @Input({ required: true }) number?: number;
  @Input({ required: true }) color?: 'red' | 'gold';
  red: string = '';
  gold: string = '';
  dieColor = '';
  pipColor = '';

  ngOnInit() {
    this.red = getComputedStyle(document.documentElement).getPropertyValue(
      '--ion-color-danger'
    );
    this.gold = getComputedStyle(document.documentElement).getPropertyValue(
      '--ion-color-warning'
    );
    this.dieColor = this.color === 'red' ? this.red : this.gold;
    this.pipColor = this.color === 'red' ? this.gold : this.red;
  }

}
