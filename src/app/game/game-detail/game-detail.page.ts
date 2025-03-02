import {AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnInit, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButton, IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonLabel,
  IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {GameService} from "../game.service";
import {ViewWillEnter} from '@ionic/angular';
import {Game, Roll} from "../../shared/types";
import {Router} from "@angular/router";
import {GameSummaryComponent} from "../components/game-summary/game-summary.component";
import {GameRollsComponent} from "../components/game-rolls/game-rolls.component";
import {GameHistogramComponent} from "../components/game-histogram/game-histogram.component";
import {liveQuery} from "dexie";
import {StatisticsService} from "../../shared/statistics.service";
import Swiper from "swiper";

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.page.html',
  styleUrls: ['./game-detail.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, GameSummaryComponent, GameRollsComponent, GameHistogramComponent, IonIcon]
})
export class GameDetailPage implements ViewWillEnter, OnInit, AfterViewInit {

  readonly swiperContainer = viewChild.required<ElementRef>('swiperContainer');
  activeGame?: Game;
  rolls: Roll[] = [];
  selectedSegment = 0;

  readonly alertController = inject(AlertController);
  readonly router = inject(Router);
  readonly gameService = inject(GameService);
  readonly statisticService = inject(StatisticsService);

  async ngOnInit() {

    this.activeGame = await this.gameService.getActiveGame();
    this.rolls = await this.gameService.getRollsByGameId(this.activeGame?.id!);

    liveQuery(() => this.gameService.getGame(this.activeGame?.id!))
      .subscribe(async game => {
        this.activeGame = game;
        if (game) {
          const _rolls = await this.gameService.getRollsByGameId(game?.id!);
          // convert the id to a roll count then sort in reverse order.
          _rolls.forEach((r, index) => r.id = index + 1);
          _rolls.reverse();
          this.rolls = _rolls
        }
      });
  }

  ngAfterViewInit() {
    this.swiperContainer().nativeElement.addEventListener('swiperslidechange', (e: any) => {
      this.selectedSegment = e.detail[0].activeIndex;
    });
  }

  async ionViewWillEnter() {
    this.activeGame = await this.gameService.getActiveGame();
  }

  async deleteGame() {
    if (this.activeGame) {
      const alert = await this.alertController.create({
        header: 'Delete Game?',
        message: 'Are you sure? This action cannot be undone!',
        buttons: [{text: 'Cancel', role: 'cancel'}, {text: 'Delete', role: 'destructive'}]
      });
      alert.onDidDismiss().then(async (result) => {
        if (result.role === 'destructive') {
          this.gameService.deleteGame(this.activeGame!.id!);
          const players = this.activeGame!.roster.map(x => x.id);
          for (const playerId of players) {
            await this.statisticService.updatePlayerStatsById(playerId);
          }
          await this.router.navigate(['/tabs/home']);
        }
      });
      await alert.present();
    }
  }

  handleSegmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    (this.swiperContainer().nativeElement.swiper as Swiper).slideTo(event.detail.value);
  }
}
