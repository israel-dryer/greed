import { Injectable } from '@angular/core';
import SoundEffect from "./soundEffect";

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private assetPath = 'assets/sounds';
  private sounds: Record<string, SoundEffect> = {};


  constructor() {
    this.sounds.robber = new SoundEffect(`${this.assetPath}/robber-laugh.mp4`);
    this.sounds.alchemy = new SoundEffect(`${this.assetPath}/bubbles.mp4`);
    this.sounds.barbarian = new SoundEffect(`${this.assetPath}/barbarian-attack.mp4`);
    this.sounds.gameOver = new SoundEffect(`${this.assetPath}/game-over.mp4`);
    this.sounds.dice = new SoundEffect(`${this.assetPath}/rolling-dice.mp4`);
  }

  playSound(name: string) {
    return this.sounds[name].play();
  }


}
