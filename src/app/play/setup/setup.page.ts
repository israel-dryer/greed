import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonAlert, IonBackButton, IonBadge,
  IonButton, IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem, IonLabel,
  IonList, IonListHeader,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';
import {PlayService} from "../play.service";
import {PlayerService} from "../../player/player.service";
import {Player, RosterPlayer, Settings} from "../../shared/types";
import {liveQuery} from "dexie";
import {SettingsService} from "../../settings/settings.service";
import {state} from "@angular/animations";
import {GameService} from "../../game/game.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonCheckbox, IonItem, IonToggle, IonButton, IonListHeader, IonLabel, IonAlert, IonAccordionGroup, IonAccordion, IonBadge, IonButtons, IonBackButton]
})
export class SetupPage implements OnInit {

  readonly gameService = inject(GameService);
  readonly playService = inject(PlayService);
  readonly playerService = inject(PlayerService);
  readonly settingsService = inject(SettingsService);
  readonly router = inject(Router);
  players: Player[] = [];

  selectedRosterIds: number[] = [];
  useFairDice = false;
  isSeafarers = false;
  isCitiesKnights = false;

  async ngOnInit() {
    const settings = await this.settingsService.getSettings();
    this.useFairDice = settings!.fairDice === 1;

    liveQuery(() => this.playerService.getActivePlayers())
      .subscribe(players => this.players = players.sort((a, b) => a.lastPlayed > b.lastPlayed ? -1 : 1));
  }

  handleSelectedPlayer(id: number) {
    if (this.selectedRosterIds.includes(id)) {
      // remove player
      this.selectedRosterIds = this.selectedRosterIds.filter(x => x !== id);
    } else {
      if (this.selectedRosterIds.length === 6) {
        // too many players
        return;
      } else {
        // add player
        this.selectedRosterIds.push(id);
      }
    }
  }

  handleFairDiceChanged() {
    this.useFairDice = !this.useFairDice;
  }

  handleCitiesKnightsChanged() {
    this.isCitiesKnights = !this.isCitiesKnights;
  }

  handleSeafarersChanged() {
    this.isSeafarers = !this.isSeafarers;
  }

  async startGame() {
    const roster: RosterPlayer[] = [];
    this.players.forEach(player => {
      if (this.selectedRosterIds.includes(player.id!)) {
        roster.push({id: player.id!, name: player.name});
      }
    });

    const game = await this.gameService.createGame(
      this.useFairDice ? 1 : 0,
      roster,
      0,
      this.isSeafarers ? 1 : 0,
      this.isCitiesKnights ? 1 : 0);

    this.gameService.setActiveGame(game);
    this.playService.startGame(game);
    await this.router.navigate(['playground'], {replaceUrl: true});
  }


  protected readonly state = state;
}
