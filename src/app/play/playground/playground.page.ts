import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController, IonActionSheet,
  IonButton, IonButtons,
  IonContent, IonFooter,
  IonHeader, IonIcon, IonLabel, IonModal, IonText,
  IonTitle,
  IonToolbar, Platform, ViewWillLeave
} from '@ionic/angular/standalone';
import {PlayService} from '../play.service';
import {ActionSheetButton, AlertInput, ViewWillEnter} from "@ionic/angular";
import {Router, RouterLink} from "@angular/router";
import {BarbarianTrackComponent} from "../components/barbarian-track/barbarian-track.component";
import {StandardDieComponent} from "../components/standard-die/standard-die.component";
import {ActionDieComponent} from "../components/action-die/action-die.component";
import {AlchemyPickerComponent} from "../components/alchemy-picker/alchemy-picker.component";
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {EdgeToEdge} from "@capawesome/capacitor-android-edge-to-edge-support";
import {StatusBar} from "@capacitor/status-bar";
import {Capacitor} from "@capacitor/core";

const ROLL_DURATION = 750;

@Component({
  selector: 'app-playground',
  templateUrl: './playground.page.html',
  styleUrls: ['./playground.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonActionSheet, RouterLink, IonIcon, IonText, IonFooter, BarbarianTrackComponent, StandardDieComponent, ActionDieComponent, IonLabel, AlchemyPickerComponent, IonButtons, IonModal, NgOptimizedImage],
  animations: [
    trigger('jiggleRed', [
      state('active', style({})),
      transition('* => active', [
        animate(
          `${ROLL_DURATION}ms`,
          keyframes([
            style({transform: 'translate3d(0, 0, 0) rotate(0deg)'}),
            style({transform: 'translate3d(-1px, 0, 0) rotate(-5deg)'}),
            style({transform: 'translate3d(2px, 0, 0) rotate(0deg)'}),
            style({transform: 'translate3d(-4px, 0, 0)'}),
            style({transform: 'translate3d(4px, 0, 0) rotate(5deg)'}),
            style({transform: 'translate3d(1px, 0, 0) rotate(5deg)'}),
            style({transform: 'translate3d(-2px, 0, 0) rotate(0deg)'}),
            style({transform: 'translate3d(0, 0, 0)'}),
          ]),
        ),
      ]),
    ]),
    trigger('jiggleGold', [
      state('active', style({})),
      transition('* => active', [
        animate(
          `${ROLL_DURATION}ms`,
          keyframes([
            style({transform: 'translate3d(0, 0, 0) rotate(0deg)'}),
            style({transform: 'translate3d(1px, 0, 0) rotate(5deg)'}),
            style({transform: 'translate3d(-2px, 0, 0) rotate(0deg)'}),
            style({transform: 'translate3d(4px, 0, 0)'}),
            style({transform: 'translate3d(-4px, 0, 0) rotate(-5deg)'}),
            style({transform: 'translate3d(1px, 0, 0) rotate(5deg)'}),
            style({transform: 'translate3d(-2px, 0, 0) rotate(0deg)'}),
            style({transform: 'translate3d(0, 0, 0)'}),
          ]),
        ),
      ]),
    ]),
  ]
})
export class PlaygroundPage implements OnInit, ViewWillEnter, ViewWillLeave, OnDestroy {

  readonly alertController = inject(AlertController);
  readonly playService = inject(PlayService);
  readonly router = inject(Router);
  readonly platform = inject(Platform);

  // time duration state
  private readonly timerIntervalCallback?: any;
  elapsedHours = 0;
  elapsedMinutes = 0;
  elapsedSeconds = 0;
  headerColor: string;
  backgroundColor: string;
  isIos: boolean;
  actionSheetButtons: ActionSheetButton[];
  isDarkTheme: boolean;
  isRobberModalOpen = false;
  isBarbarianModalOpen = false;
  isGameOverModalOpen = false
  isPauseGameModalOpen = false;
  gameOverMessage = '';

  constructor() {
    this.timerIntervalCallback = setInterval(() => this.updateDurationDisplay(), 1000);
    this.isIos = this.platform.is('ios');
    this.actionSheetButtons = [
      {text: 'Undo Roll', data: {action: 'undo'}, icon: this.isIos ? undefined : 'undo'},
      {text: 'End Game', data: {action: 'end'}, icon: this.isIos ? undefined : 'medal'},
      {text: 'Cancel', role: 'cancel', data: {action: 'cancel'}, icon: this.isIos ? undefined : 'close'}
    ];
    this.isDarkTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    this.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--ion-background-color');
    if (this.isDarkTheme) {
      this.headerColor = getComputedStyle(document.documentElement).getPropertyValue('--md-surfaceContainerHigh');
    } else {
      this.headerColor = getComputedStyle(document.documentElement).getPropertyValue('--md-surfaceContainer');
    }
  }

  async ngOnInit() {
    await this.playService.initializeGameData();
  }

  ngOnDestroy() {
    clearInterval(this.timerIntervalCallback);
  }

  async ionViewWillEnter() {
    if (Capacitor.isNativePlatform()) {
      if (this.platform.is('android')) {
        EdgeToEdge.setBackgroundColor({color: this.headerColor}).then();
      }
      await StatusBar.setBackgroundColor({color: this.headerColor});
    }
  }

  async ionViewWillLeave() {
    if (Capacitor.isNativePlatform()) {
      if (this.platform.is('android')) {
        EdgeToEdge.setBackgroundColor({color: this.backgroundColor}).then();
      }
      await StatusBar.setBackgroundColor({color: this.backgroundColor});
    }
  }

  async rollDice(alchemyDice?: any) {
    this.playService.isRolling.set(true);
    await this.playService.useRollHaptic();
    await this.playService.playSoundRollingDice();
    await this.playService.rollDice(alchemyDice);
    if (this.playService.barbariansAttack) {
      await this.playService.playSoundBarbarianAttack();
      this.isBarbarianModalOpen = true;
    } else if (this.playService.robberStealing) {
      await this.playService.playSoundRobberLaugh();
      this.isRobberModalOpen = true;
      this.playService.resetRobberStealing();
    } else {
      setTimeout(async () => await this.playService.announceRollResult(this.playService.diceTotal.toString()), 500);

    }
    setTimeout(() => this.playService.isRolling.set(false), ROLL_DURATION);
  }

  async handleAlchemyDialogDidDismiss({detail}: any) {
    if (detail.role === 'confirm') {
      const dice1 = parseInt(detail.data.dice1);
      const dice2 = parseInt(detail.data.dice2);
      const alchemyDice = {dice1, dice2};
      await this.rollDice(alchemyDice);
    }
  }

  async handleActionSheetDidDismiss(event: any) {
    const {data, role} = event.detail;
    if (role === 'backdrop' || role === 'cancel') {
      return;
    } else if (data.action === 'end') {
      await this.showSelectWinnerAlert();
    } else if (data.action === 'undo') {
      if (this.playService.activeGame?.lastRoll) {
        await this.playService.undoLastRoll();
      }
    } else if (data.action === 'settings') {
      await this.router.navigate(['/app-settings']);
    }
  }

  async showGameOverDialog(duration: number, winner?: string) {
    if (winner) {
      await this.playService.playSoundGameOver();
      this.gameOverMessage = `${winner} is victorious!`
      this.isGameOverModalOpen = true;
    } else {
      this.gameOverMessage = `Game paused`;
      this.isPauseGameModalOpen = true;
    }
  }

  async showSelectWinnerAlert() {
    if (!this.playService.activeGame) return;
    const alertInputs: AlertInput[] = this.playService.activeGame.roster.map(player => ({
      label: player.name,
      type: 'radio',
      value: {id: player.id, name: player.name},
    }));
    const alert = await this.alertController.create({
      header: 'Game Over?',
      message: 'If you do not choose a winner, the game will be paused.',
      inputs: alertInputs,
      buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Ok', role: 'submit'}]
    });
    alert.onDidDismiss().then(async ({data, role}) => {
      if (role !== 'submit') return;
      const game = Object.assign({}, this.playService.activeGame);
      await this.playService.endGame(data.values);
      if (game.winnerId) {
        await this.playService.endGame(data.values);
      }
      await this.showGameOverDialog(game.duration, data.values?.name);
    });
    await alert.present();
  }

  updateDurationDisplay() {
    const game = this.playService.activeGame;
    if (!game) {
      return;
    }
    const totalSeconds = (Date.now() - game.createdOn) / 1000;
    this.elapsedHours = Math.floor(totalSeconds / 60 / 60);
    this.elapsedMinutes = Math.floor(totalSeconds / 60) % 60;
    this.elapsedSeconds = totalSeconds % 60;
  }

  async dismissBarbarianModal() {
    this.isBarbarianModalOpen = false;
    await this.playService.resetBarbarians();
  }

  dismissGameOverModal() {
    this.isGameOverModalOpen = false;
    this.isPauseGameModalOpen = false;
    setTimeout(() => this.router.navigate(['/']));
  }

  dismissRobberModal() {
    this.isRobberModalOpen = false;
  }

}
