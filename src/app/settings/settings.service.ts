import {Injectable} from '@angular/core';
import {db} from "../shared/database";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  updateSettings(changes: Record<string, any>) {
    return db.settings.update(1, changes);
  }

  resetSettings() {
    return db.settings.update(1, {
      rollingDice: 1,
      robberLaugh: 1,
      barbarianAttack: 1,
      gameOver: 1,
      fairDice: 1,
      rollHaptics: 1,
      rollAnnouncer: 1
    });
  }

  getSettings() {
    return db.settings.get(1);
  }

}
