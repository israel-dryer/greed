import { Injectable } from '@angular/core';
import { db } from "../shared/database";
import { Settings, DEFAULT_SETTINGS } from "../shared/types";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  updateSettings(changes: Partial<Settings>) {
    return db.settings.update(1, changes);
  }

  resetSettings() {
    return db.settings.update(1, { ...DEFAULT_SETTINGS });
  }

  getSettings(): Promise<Settings | undefined> {
    return db.settings.get(1);
  }

}
