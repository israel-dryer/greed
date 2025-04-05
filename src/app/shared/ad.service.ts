import {Injectable} from '@angular/core';
import {
  AdLoadInfo,
  AdMob, AdmobConsentStatus, AdOptions,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';

@Injectable({
  providedIn: 'root'
})
export class AdService {

  private androidAdId = 'ca-app-pub-8770270739057022/7767323698';
  private iosAdId = 'ca-app-pub-3940256099942544/2934735716';

  constructor() {
  }

  async initialize(): Promise<void> {
    await AdMob.initialize();

    // iOS: Ask for tracking permission
    const [trackingInfo, consentInfo] = await Promise.all([
      AdMob.trackingAuthorizationStatus(),
      AdMob.requestConsentInfo()
    ]);

    if (trackingInfo.status === 'notDetermined') {
      await AdMob.requestTrackingAuthorization();
    }

    const authStatus = await AdMob.trackingAuthorizationStatus();

    if (
      authStatus.status === 'authorized' &&
      consentInfo.isConsentFormAvailable &&
      consentInfo.status == AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
  }

  async showInterstitial(): Promise<void> {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      // Subscribe prepared interstitial
    });

    const options: AdOptions = {
      adId: this.getPlatformAdId(),
      isTesting: true,
      npa: true
    };
    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
  }

  private getPlatformAdId(): string {
    // Use platform-specific IDs here
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return isIOS
      ? this.iosAdId // iOS test banner ID
      : this.androidAdId;
  }
}
