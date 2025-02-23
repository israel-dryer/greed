import {Component, inject, OnInit} from '@angular/core';
import {
  IonBackButton, IonButtons,
  IonContent, IonHeader,
  IonIcon,
  IonNav,
  IonRouterOutlet,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs, IonTitle, IonToolbar
} from "@ionic/angular/standalone";
import {Player} from "../shared/types";
import {Router} from "@angular/router";
import {PlayerService} from "../player/player.service";
import {liveQuery} from "dexie";

@Component({
  selector: 'app-root-tabs',
  templateUrl: './root-tabs.component.html',
  styleUrls: ['./root-tabs.component.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonRouterOutlet,
  ]
})
export class RootTabsComponent  implements OnInit {

  userPlayer?: Player;

  readonly router = inject(Router);
  readonly playerService = inject(PlayerService);

  constructor() {
  }

  ngOnInit() {
    liveQuery(() => this.playerService.getUserPlayer())
      .subscribe(player => this.userPlayer = player);
  }

  async handleMyStatsClicked() {
    this.playerService.setActivePlayer(this.userPlayer!);
  }


}
