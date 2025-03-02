export default class SoundEffect {

  isPlaying = false;
  private audio: HTMLAudioElement;

  constructor(assetPath: string) {
    this.audio = new Audio(assetPath);
    this.audio.preload = "auto";
    this.audio.onended = () => this.isPlaying = false;
    this.resetAudio();
  }

  play() {
    if (this.isPlaying) {
      this.resetAudio();
    }
    this.isPlaying = true;
    return this.audio.play();
  }

  private resetAudio() {
    this.audio.load();
    this.audio.currentTime = 0;
  }

}
