import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';
import { Settings, GameRules, DEFAULT_GAME_RULES, DEFAULT_SCORE_PRESETS } from "../../shared/types";
import { SettingsService } from "../settings.service";
import { Router } from "@angular/router";
import { addIcons } from "ionicons";
import { cloudUpload, exit, gitCommit, lockClosed, logIn, newspaper, server, trash, settings } from "ionicons/icons";
import { APP_VERSION } from "../../../main";
import { AuthService } from "../../shared/auth.service";
import { SyncService } from "../../shared/sync.service";
import { db } from "../../shared/database";

@Component({
  selector: 'app-app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonList, IonItem, IonLabel, IonToggle, IonButton, IonButtons, IonBackButton,
    IonNote, IonIcon, IonText, IonInput, IonSelect, IonSelectOption
  ]
})
export class AppSettingsPage implements OnInit {

  settings?: Settings;
  version = inject(APP_VERSION);
  readonly router = inject(Router);
  readonly settingsService = inject(SettingsService);
  readonly alertController = inject(AlertController);
  readonly authService = inject(AuthService);
  readonly syncService = inject(SyncService);

  readonly isLoggedIn = computed(() => this.authService.isAuthenticated());
  readonly userEmail = computed(() => this.authService.getUserEmail());

  async ngOnInit() {
    addIcons({ gitCommit, exit, newspaper, lockClosed, server, logIn, cloudUpload, trash, settings });
    this.settings = await this.settingsService.getSettings();
  }

  // Default Rules Changes
  targetScoreChanged(event: any) {
    const value = parseInt(event.detail.value);
    if (this.settings && value > 0) {
      this.settings.defaultRules.targetScore = value;
      this.settingsService.updateSettings({ defaultRules: this.settings.defaultRules });
    }
  }

  onBoardThresholdChanged(event: any) {
    const value = parseInt(event.detail.value);
    if (this.settings && value >= 0) {
      this.settings.defaultRules.onBoardThreshold = value;
      this.settingsService.updateSettings({ defaultRules: this.settings.defaultRules });
    }
  }

  mustHitExactlyChanged(event: any) {
    if (this.settings) {
      this.settings.defaultRules.mustHitExactly = event.detail.checked;
      this.settingsService.updateSettings({ defaultRules: this.settings.defaultRules });
    }
  }

  overshootPenaltyChanged(event: any) {
    if (this.settings) {
      this.settings.defaultRules.overshootPenaltyType = event.detail.value;
      this.settingsService.updateSettings({ defaultRules: this.settings.defaultRules });
    }
  }

  allowCarryOverChanged(event: any) {
    if (this.settings) {
      this.settings.defaultRules.allowCarryOverBank = event.detail.checked;
      this.settingsService.updateSettings({ defaultRules: this.settings.defaultRules });
    }
  }

  async resetRulesToDefault() {
    if (this.settings) {
      this.settings.defaultRules = { ...DEFAULT_GAME_RULES };
      await this.settingsService.updateSettings({ defaultRules: this.settings.defaultRules });
    }
  }

  async resetPresetsToDefault() {
    if (this.settings) {
      this.settings.scorePresets = [...DEFAULT_SCORE_PRESETS];
      await this.settingsService.updateSettings({ scorePresets: this.settings.scorePresets });
    }
  }

  async deleteAccount() {
    const alert = await this.alertController.create({
      header: 'Delete Account',
      message: 'Are you sure? This will delete all your data. This action cannot be undone.',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive' }]
    });
    alert.onDidDismiss().then(async event => {
      if (event.role !== 'destructive') {
        return;
      }
      // Delete cloud data
      if (this.authService.isAuthenticated()) {
        await this.syncService.deleteCloudData();
      }
      // Delete local data
      await db.games.clear();
      await db.players.clear();
      await db.turns.clear();
      await db.settings.clear();
      // Clear app-specific localStorage (only items with Greed prefix)
      const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith('Greed.'));
      keysToRemove.forEach(key => localStorage.removeItem(key));
      // Sign out
      await this.authService.signOut();
      await this.router.navigate(['/login'], { replaceUrl: true });
    });
    await alert.present();
  }

  async logout() {
    this.syncService.onUserLogout();
    await this.authService.signOut();
    localStorage.removeItem('Greed.authSkipped');
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  async login() {
    await this.router.navigate(['/login']);
  }

  async syncData() {
    const alert = await this.alertController.create({
      header: 'Sync Data',
      message: 'Syncing your data to the cloud...',
      backdropDismiss: false
    });
    await alert.present();

    try {
      await this.syncService.syncToCloud();
      alert.message = 'Data synced successfully!';
      alert.buttons = [{ text: 'OK', role: 'cancel' }];
    } catch (error: any) {
      alert.header = 'Sync Failed';
      alert.message = error.message || 'Failed to sync data';
      alert.buttons = [{ text: 'OK', role: 'cancel' }];
    }
  }

}
