import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonContent,
  IonHeader, IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle, IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Settings} from "../../shared/types";
import {SettingsService} from "../settings.service";
import {liveQuery} from "dexie";
import {RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {dice, people, server} from "ionicons/icons";

@Component({
  selector: 'app-app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, RouterLink, IonListHeader, IonLabel, IonToggle, IonIcon]
})
export class AppSettingsPage implements OnInit {

  settings?: Settings;
  readonly settingsService = inject(SettingsService);

  constructor() {
    addIcons({dice, people, server})
  }

  ngOnInit() {
    liveQuery(() => this.settingsService.getSettings())
      .subscribe(settings => this.settings = settings);
  }

  handleSettingsChange(setting: string, event: any) {
    const value = event.detail.checked ? 1 : 0;
    if (this.settings) {
      const changes = Object.assign({}, this.settings) as Record<string, any>;
      changes[setting] = value;
      this.settingsService.updateSettings(changes);
    }
  }

}
