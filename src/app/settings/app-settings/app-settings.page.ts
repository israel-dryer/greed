import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote, IonText,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Settings} from "../../shared/types";
import {SettingsService} from "../settings.service";
import {liveQuery} from "dexie";
import {Router} from "@angular/router";
import {db} from "../../shared/database";
import {addIcons} from "ionicons";
import {gitCommit} from "ionicons/icons";

@Component({
  selector: 'app-app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonToggle, IonButtons, IonBackButton, IonNote, IonIcon, IonText]
})
export class AppSettingsPage implements OnInit {

  settings?: Settings;

  readonly router = inject(Router);
  readonly settingsService = inject(SettingsService);
  readonly alertController = inject(AlertController);


  ngOnInit() {
    addIcons({gitCommit})
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

  async confirmDeleteAppData() {
    const handler = async () => {
      await db.games.clear();
      await db.players.clear();
      await db.rolls.clear();
      localStorage.clear();
      await this.router.navigate(['/']);
    }

    const alert = await this.alertController.create({
      header: 'Delete App Data',
      message: 'Are you sure? This action cannot be undone?',
      buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Confirm', role: 'submit', handler}]
    });
    await alert.present();
  }

  importAppData() {

  }


}
