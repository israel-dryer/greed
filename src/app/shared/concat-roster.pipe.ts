import { Pipe, PipeTransform } from '@angular/core';
import {RosterPlayer} from "./types";

@Pipe({
  name: 'concatRoster',
  standalone: true
})
export class ConcatRosterPipe implements PipeTransform {

  transform(value: RosterPlayer[]): string {
    return value.map(r => r.name).join(', ');
  }

}
