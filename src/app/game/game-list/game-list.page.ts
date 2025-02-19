import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Game} from "../../shared/types";
import {GameService} from "../game.service";
import {liveQuery} from "dexie";
import {Router} from "@angular/router";
import {GameDetailCardComponent} from "../components/game-detail-card/game-detail-card.component";

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.page.html',
  styleUrls: ['./game-list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, GameDetailCardComponent]
})
export class GameListPage implements OnInit {

  games: Game[] = [];
  readonly gameService = inject(GameService);
  readonly router = inject(Router);

  ngOnInit() {
    liveQuery(() => this.gameService.getGames())
      .subscribe(games => this.games = games.sort((a, b) => a.createdOn < b.createdOn ? 1 : -1));
  }

}
