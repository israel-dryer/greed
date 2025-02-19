import { Component } from '@angular/core';
import {
  IonHeader,
  IonContent,
  IonButton,
  IonRouterLink,
  IonIcon, IonLabel, IonToolbar, IonTitle, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import {RouterLink} from "@angular/router";
import {GameListPage} from "../game/game-list/game-list.page";
import {GameSummaryCardComponent} from "../game/components/game-summary-card/game-summary-card.component";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonContent, IonButton, IonRouterLink, RouterLink, IonIcon, IonLabel, IonToolbar, IonTitle, IonBackButton, IonButtons, GameListPage, GameSummaryCardComponent],
})
export class HomePage {
  constructor() {}
}
