import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController, IonBackButton,
  IonButton, IonButtons,
  IonContent,
  IonHeader,
  IonIcon, IonLabel, IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Player} from "../../shared/types";
import {addIcons} from "ionicons";
import {bookmark, bookmarkOutline} from "ionicons/icons";
import {Router} from "@angular/router";
import {PlayerService} from "../player.service";
import {PlayerSummaryComponent} from "../components/player-summary/player-summary.component";
import {PlayerHistogramComponent} from "../components/player-histogram/player-histogram.component";
import {liveQuery} from "dexie";
import Swiper from "swiper";

@Component({
  selector: 'app-player-detail',
  templateUrl: './user-detail.page.html',
  styleUrls: ['./user-detail.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonIcon, IonButtons, IonBackButton, PlayerSummaryComponent, IonSegment, IonSegmentButton, IonLabel, PlayerHistogramComponent, PlayerSummaryComponent, PlayerHistogramComponent]
})
export class UserDetailPage implements OnInit, OnDestroy, AfterViewInit {

  readonly swiperContainer = viewChild.required<ElementRef>('swiperContainer');
  readonly router = inject(Router);
  readonly alertController = inject(AlertController);
  readonly playerService = inject(PlayerService);
  selectedSegment = 0;
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

  ngAfterViewInit() {
    this.swiperContainer().nativeElement.addEventListener('swiperslidechange', (e: any) => {
      this.selectedSegment = e.detail[0].activeIndex;
    });
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

  handleSegmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    (this.swiperContainer().nativeElement.swiper as Swiper).slideTo(event.detail.value);
  }

}
