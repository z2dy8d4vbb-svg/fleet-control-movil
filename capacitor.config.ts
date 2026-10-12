import type { CapacitorConfig } from '@capacitor/cli';

/* Fleet Control · app de iPhone y Android.
   Una sola app para todas las empresas: al abrirse pide el código de
   empresa y descarga su configuración de wolftechsoluciones.com. */
const config: CapacitorConfig = {
  appId: 'com.wolftechsoluciones.fleetcontrol',
  appName: 'Fleet Control',
  webDir: 'www',
  backgroundColor: '#0a1018',
  android: {
    // Android 15 obliga a dibujar bajo las barras del sistema; con esto
    // Capacitor deja los márgenes y la app no se mete debajo del reloj.
    adjustMarginsForEdgeToEdge: 'auto',
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'never',
    // La barra de estado la gestiona el plugin StatusBar; la app ya reserva
    // la zona segura con env(safe-area-inset-top).
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0a1018',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0e1721',
    },
  },
};

export default config;
