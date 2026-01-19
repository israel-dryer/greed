import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';
import { PlayService } from "../play.service";
import { PlayerService } from "../../player/player.service";
import { Player, RosterPlayer, GameRules, OvershootPenaltyType, DEFAULT_GAME_RULES } from "../../shared/types";
import { liveQuery } from "dexie";
import { SettingsService } from "../../settings/settings.service";
import { GameService } from "../../game/game.service";
import { Router } from "@angular/router";
import { addIcons } from "ionicons";
import { informationCircle } from "ionicons/icons";

@Component({
  selector: 'app-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonList, IonCheckbox, IonItem, IonToggle, IonButton, IonLabel,
    IonButtons, IonBackButton, IonNote, IonIcon, IonInput, IonSelect, IonSelectOption
  ]
})
export class SetupPage implements OnInit {

  readonly gameService = inject(GameService);
  readonly playService = inject(PlayService);
  readonly playerService = inject(PlayerService);
  readonly settingsService = inject(SettingsService);
  readonly router = inject(Router);
  players: Player[] = [];

  selectedRosterIds: number[] = [];
  startRandomPlayer = true;

  // House Rules
  rules: GameRules = { ...DEFAULT_GAME_RULES };

  constructor() {
    addIcons({ informationCircle });
  }

  async ngOnInit() {
    const settings = await this.settingsService.getSettings();
    if (settings?.defaultRules) {
      this.rules = { ...settings.defaultRules };
    }

    liveQuery(() => this.playerService.getActivePlayers())
      .subscribe(players => this.players = players.sort((a, b) => a.lastPlayed > b.lastPlayed ? -1 : 1));
  }

  handleSelectedPlayer(id: number) {
    if (this.selectedRosterIds.includes(id)) {
      this.selectedRosterIds = this.selectedRosterIds.filter(x => x !== id);
    } else {
      this.selectedRosterIds.push(id);
    }
  }

  handleStartRandomPlayer() {
    this.startRandomPlayer = !this.startRandomPlayer;
  }

  handleMustHitExactlyChanged() {
    this.rules.mustHitExactly = !this.rules.mustHitExactly;
  }

  handleAllowCarryOverChanged() {
    this.rules.allowCarryOverBank = !this.rules.allowCarryOverBank;
  }

  onOvershootPenaltyChange(event: any) {
    this.rules.overshootPenaltyType = event.detail.value as OvershootPenaltyType;
  }

  async startGame() {
    localStorage.removeItem('Greed.activeGame');
    const roster: RosterPlayer[] = [];
    this.selectedRosterIds.forEach(id => {
      const player = this.players.find(p => p.id === id)!;
      roster.push({ id, name: player.name });
    });

    const game = await this.gameService.createGame(
      this.selectedRosterIds,
      roster,
      this.rules
    );

    // Optionally randomize starting player
    if (this.startRandomPlayer) {
      const randomIndex = Math.floor(Math.random() * this.selectedRosterIds.length);
      await this.gameService.updateGame(game.id!, { currentPlayerIndex: randomIndex });
      game.currentPlayerIndex = randomIndex;
    }

    this.gameService.setActiveGame(game);
    await this.playService.startGame(game);
    await this.router.navigate(['playground'], { replaceUrl: true });
  }
}
