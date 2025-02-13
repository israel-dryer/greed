import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController, IonActionSheet,
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {PlayService} from '../play.service';
import {ActionSheetButton, AlertInput} from "@ionic/angular";
import {Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-playground',
  templateUrl: './playground.page.html',
  styleUrls: ['./playground.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonActionSheet, RouterLink]
})
export class PlaygroundPage {

  readonly alertController = inject(AlertController);
  readonly playService = inject(PlayService);
  readonly router = inject(Router);

  actionSheetButtons: ActionSheetButton[] = [
    {text: 'Undo Roll', data: {action: 'undo'}},
    {text: 'End Game', data: {action: 'end'}},
    {text: 'Settings', data: {action: 'settings'}},
    {text: 'Cancel', role: 'cancel', data: {action: 'cancel'}}
  ];

  async rollDice(alchemyDice?: any) {
    this.playService.playSoundRollingDice();
    await this.playService.rollDice(alchemyDice);
    if (this.playService.barbariansAttack) {
      this.playService.playSoundBarbarianAttack();
      await this.showBarbarianAttackAlert();
    } else if (this.playService.robberStealing) {
      this.playService.playSoundRobberLaugh();
      this.playService.resetRobberStealing();
    }
  }

  async showAlchemyDialog() {
    const alert = await this.alertController.create({
      header: 'Alchemist',
      message: 'Choose the dice values you wish to roll',
      inputs: [
        {label: 'Dice 1', type: 'number', name: 'dice1'},
        {label: 'Dice 2', type: 'number', name: 'dice2'},
      ],
      buttons: [
        {text: 'Cancel', role: 'cancel'},
        {text: 'Roll', role: 'submit'}
      ]
    });
    alert.onDidDismiss().then((event) => this.handleAlchemyDialogDidDismiss(event));
    await alert.present();
  }

  async handleAlchemyDialogDidDismiss(event: any) {
    if (event.role === 'submit') {
      const dice1 = parseInt(event.data.values.dice1);
      const dice2 = parseInt(event.data.values.dice2);
      const alchemyDice = {dice1, dice2};
      await this.rollDice(alchemyDice);
    }
  }

  async showBarbarianAttackAlert() {
    this.playService.playSoundBarbarianAttack();
    const alert = await this.alertController.create({
      header: 'ATTACK!',
      message: 'The barbarians are attacking!!!',
      buttons: [{text: 'Ok', role: 'submit'}]
    });
    alert.onDidDismiss().then(async () => await this.playService.resetBarbarians());
    await alert.present();
  }

  async handleActionSheetDidDismiss(event: any) {
    console.log(event);
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
    let message: string;
    if (winner) {
      this.playService.playSoundGameOver();
      message = `${winner} has won in ${(duration / 60).toFixed(1)} minutes`
    } else {
      message = `Game was paused after ${(duration / 60).toFixed(1)} minutes. You may continue again later by selecting this game from the game list`;
    }
    const alert = await this.alertController.create({
      header: winner ? 'Game Over' : 'Game Paused',
      message,
      buttons: [{text: 'Ok'}]
    });
    alert.onDidDismiss().then(() => this.router.navigate(['/']));
    await alert.present();
  }

  async showSelectWinnerAlert() {
    if (!this.playService.activeGame) return;
    const alertInputs: AlertInput[] = this.playService.activeGame.roster.map(player => ({
      label: player.name,
      type: 'radio',
      value: {id: player.id, name: player.name},
    }));
    const alert = await this.alertController.create({
      header: 'End Game',
      message: 'Choose a winner (optional)',
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


}
