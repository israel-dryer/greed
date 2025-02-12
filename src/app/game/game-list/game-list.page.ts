import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonAvatar, IonBackButton, IonButtons,
  IonContent,
  IonHeader,
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

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.page.html',
  styleUrls: ['./game-list.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonText, IonNote, ConcatRosterPipe, IonAvatar, IonButtons, IonBackButton]
})
export class GameListPage implements OnInit {

  games: Game[] = [];
  readonly gameService = inject(GameService);
  readonly router = inject(Router);

  ngOnInit() {
    liveQuery(() => this.gameService.getGames())
      .subscribe(games => this.games = games);
  }

  async handleItemClicked(game: Game) {
    this.gameService.setActiveGame(game);
    await this.router.navigate(['game-detail'])
  }

}
