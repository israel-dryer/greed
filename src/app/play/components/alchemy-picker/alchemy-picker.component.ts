import {Component, Input} from '@angular/core';
import {IonButton, IonIcon, IonText} from "@ionic/angular/standalone";

@Component({
  selector: 'app-alchemy-picker',
  templateUrl: './alchemy-picker.component.html',
  styleUrls: ['./alchemy-picker.component.scss'],
  imports: [
    IonButton,
    IonIcon,
    IonText
  ]
})
export class AlchemyPickerComponent {

  private _value = 1;
  @Input() color = 'primary';

  increment = () => {
    this.value = this.value + 1;
  };

  decrement = () => {
    this.value = this.value - 1;
  };

  get value() {
    return this._value;
  }

  set value(value: number) {
    this._value = Math.max(Math.min(value, 6), 1);
  }

}
