import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.appforia.settlersdice',
  appName: 'Settlers Dice',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      backgroundColor: '#782b2f',
      splashFullScreen: false,
      splashImmersive: false,
    }
  }
};

export default config;
