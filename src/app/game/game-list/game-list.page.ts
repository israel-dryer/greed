import {Component, inject, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonAvatar, IonBackButton, IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonItem,
  IonLabel,
  IonList, IonNote,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Game} from "../../shared/types";
import {GameService} from "../game.service";
import {liveQuery} from "dexie";
import {ConcatRosterPipe} from "../../shared/concat-roster.pipe";
import {Router} from "@angular/router";
import {addIcons} from "ionicons";
import {trophy} from "ionicons/icons";

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.page.html',
  styleUrls: ['./game-list.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonText, IonNote, ConcatRosterPipe, IonAvatar, IonButtons, IonBackButton, NgOptimizedImage, IonIcon]
})
export class GameListPage implements OnInit {

  games: Game[] = [];
  readonly gameService = inject(GameService);
  readonly router = inject(Router);

  ngOnInit() {
    addIcons({trophy});
    liveQuery(() => this.gameService.getGames())
      .subscribe(games => this.games = games.sort((a, b) => a.createdOn < b.createdOn ? 1 : -1));
  }

  async handleItemClicked(game: Game) {
    this.gameService.setActiveGame(game);
    await this.router.navigate(['game-detail'])
  }

}
