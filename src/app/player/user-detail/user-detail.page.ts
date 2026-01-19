import {
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController, IonBackButton,
  IonButton, IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Player} from "../../shared/types";
import {addIcons} from "ionicons";
import {bookmark, bookmarkOutline} from "ionicons/icons";
import {Router} from "@angular/router";
import {PlayerService} from "../player.service";
import {PlayerSummaryComponent} from "../components/player-summary/player-summary.component";
import {liveQuery} from "dexie";

@Component({
  selector: 'app-player-detail',
  templateUrl: './user-detail.page.html',
  styleUrls: ['./user-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonIcon, IonButtons, IonBackButton, PlayerSummaryComponent]
})
export class UserDetailPage implements OnInit, OnDestroy {

  readonly router = inject(Router);
  readonly alertController = inject(AlertController);
  readonly playerService = inject(PlayerService);
  player?: Player
  private playerDataSub: any;

  constructor() {
    this.playerDataSub = liveQuery(() => this.playerService.getUserPlayer())
      .subscribe(player => this.player = player);
  }

  async ngOnInit() {
    addIcons({bookmark, bookmarkOutline})
    this.player = await this.playerService.getUserPlayer();
  }

  ngOnDestroy() {
    this.playerDataSub?.unsubscribe();
  }

  async showEditPlayerNameDialog() {
    if (!this.player) return;

    const alert = await this.alertController.create({
      header: 'Edit User Name',
      inputs: [{label: 'Name', type: 'text', name: 'playerName', value: this.player.name}],
      buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Submit', role: 'submit'}]
    });
    alert.onDidDismiss().then(async event => {
      if (event.role !== 'submit') {
        return
      }
      const name = event.data.values?.playerName;
      if (name && this.player) {
        await this.playerService.updatePlayer(this.player.id!, {name});
        this.player.name = name;
      }
    });
    await alert.present();
  }

}
