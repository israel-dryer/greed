import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonActionSheet,
  IonButton,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { PlayService, BankPreview } from '../play.service';
import { ActionSheetButton, AlertInput } from "@ionic/angular";
import { Router, RouterLink } from "@angular/router";
import { addIcons } from "ionicons";
import { menu, statsChart, trash, add, checkmark, close, arrowUndo, documentText, flag } from "ionicons/icons";

@Component({
  selector: 'app-playground',
  templateUrl: './playground.page.html',
  styleUrls: ['./playground.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonButton, IonActionSheet, RouterLink, IonIcon, IonText, IonFooter,
    IonModal, IonChip, IonInput, IonItem
  ]
})
export class PlaygroundPage implements OnDestroy {

  readonly alertController = inject(AlertController);
  readonly playService = inject(PlayService);
  readonly router = inject(Router);

  private readonly timerIntervalCallback?: any;
  elapsedHours = 0;
  elapsedMinutes = 0;
  elapsedSeconds = 0;

  actionSheetButtons: ActionSheetButton[];
  isPenaltyPreviewModalOpen = false;
  isCustomEntryModalOpen = false;

  customEntryValue = signal<number | null>(null);
  bankPreview = signal<BankPreview | null>(null);

  constructor() {
    addIcons({ menu, statsChart, trash, add, checkmark, close, arrowUndo, documentText, flag });
    this.timerIntervalCallback = setInterval(() => this.updateDurationDisplay(), 1000);
    this.actionSheetButtons = [
      { text: 'Undo Last Turn', data: { action: 'undo' }, icon: 'arrow-undo' },
      { text: 'Game Rules', data: { action: 'rules' }, icon: 'document-text' },
      { text: 'End Game', data: { action: 'end' }, icon: 'flag' },
      { text: 'Cancel', role: 'cancel', data: { action: 'cancel' }, icon: 'close' }
    ];
  }

  ngOnDestroy() {
    clearInterval(this.timerIntervalCallback);
  }

  // Score entry methods
  addPreset(points: number) {
    this.playService.addPreset(points);
  }

  addCarryOver() {
    this.playService.addCarryOver();
  }

  removeLastSegment() {
    this.playService.removeLastSegment();
  }

  clearDraft() {
    this.playService.clearDraft();
  }

  openCustomEntry() {
    this.customEntryValue.set(null);
    this.isCustomEntryModalOpen = true;
  }

  submitCustomEntry() {
    const value = this.customEntryValue();
    if (value && value > 0) {
      this.playService.addCustom(value);
    }
    this.isCustomEntryModalOpen = false;
    this.customEntryValue.set(null);
  }

  // Bank action
  async attemptBank() {
    const preview = this.playService.getBankPreview();
    this.bankPreview.set(preview);

    if (!preview.canBank) {
      return;
    }

    // Show penalty preview if overshooting with lose_full_bank
    if (preview.wouldOvershoot && preview.outcome === 'PENALTY') {
      this.isPenaltyPreviewModalOpen = true;
      return;
    }

    await this.confirmBank();
  }

  async confirmBank() {
    this.isPenaltyPreviewModalOpen = false;
    await this.playService.bank();
  }

  cancelPenaltyPreview() {
    this.isPenaltyPreviewModalOpen = false;
  }

  // Bust action
  async bust() {
    await this.playService.bust();
  }

  // Action sheet handlers
  async handleActionSheetDidDismiss(event: any) {
    const { data, role } = event.detail;
    if (role === 'backdrop' || role === 'cancel') {
      return;
    }

    if (data.action === 'end') {
      await this.endGame();
    } else if (data.action === 'undo') {
      await this.playService.undoLastTurn();
    } else if (data.action === 'rules') {
      await this.showRulesAlert();
    }
  }

  async showRulesAlert() {
    const game = this.playService.activeGame();
    if (!game) return;

    const rules = game.rules;
    const overshootLabel = {
      'lose_full_bank': 'Lose Full Turn',
      'lose_overshoot_only': 'Lose Overshoot Only',
      'cap_at_target': 'Cap at Target'
    }[rules.overshootPenaltyType];

    const alert = await this.alertController.create({
      header: 'Game Rules',
      message:
        `Target Score: ${rules.targetScore.toLocaleString()}\n` +
        `On-Board Threshold: ${rules.onBoardThreshold.toLocaleString()}\n` +
        `Hit Goal Exactly: ${rules.mustHitExactly ? 'Yes' : 'No'}\n` +
        `Overshoot: ${overshootLabel}\n` +
        `Carry-Over: ${rules.allowCarryOverBank ? 'Allowed' : 'Not Allowed'}`,
      cssClass: 'rules-alert',
      buttons: ['OK']
    });
    await alert.present();
  }

  async endGame() {
    const game = this.playService.activeGame();
    if (!game) return;

    const alertInputs: AlertInput[] = [
      { label: 'No Winner (Abandon)', type: 'radio', value: null },
      ...game.roster.map(player => ({
        label: `${player.name} (${game.totals[player.id]?.toLocaleString() || 0})`,
        type: 'radio' as const,
        value: player.id,
      }))
    ];

    const alert = await this.alertController.create({
      header: 'End Game',
      message: 'Select a winner or abandon the game.',
      inputs: alertInputs,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'End Game', role: 'submit' }
      ]
    });

    alert.onDidDismiss().then(async ({ data, role }) => {
      if (role !== 'submit') return;

      const winnerId = data.values;
      const status = winnerId === null ? 'abandoned' : 'finished';

      await this.playService.endGame(winnerId, status);
      await this.router.navigate(['/'], { replaceUrl: true });
    });

    await alert.present();
  }

  updateDurationDisplay() {
    const game = this.playService.activeGame();
    if (!game) return;

    const totalSeconds = (Date.now() - game.startedOn) / 1000;
    this.elapsedHours = Math.floor(totalSeconds / 60 / 60);
    this.elapsedMinutes = Math.floor(totalSeconds / 60) % 60;
    this.elapsedSeconds = Math.floor(totalSeconds % 60);
  }

  formatNumber(value: number): string {
    return value.toLocaleString();
  }

  getRoundNumber(): number {
    const game = this.playService.activeGame();
    if (!game) return 1;
    return Math.floor((game.turnNumber - 1) / game.playerIds.length) + 1;
  }
}
