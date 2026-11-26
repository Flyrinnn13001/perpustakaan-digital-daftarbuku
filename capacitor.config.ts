/**
 * Konfigurasi Capacitor untuk membungkus PWA menjadi APK Android / IPA iOS native:
 *   npm install @capacitor/core @capacitor/cli @capacitor/android
 *   npm run build
 *   npx cap add android
 *   npx cap sync android
 *   npx cap open android
 */
const config = {
  appId: 'id.sch.perpus.daftarbuku',
  appName: 'DaftarBuku',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0F294A',
      showSpinner: false,
    },
  },
};

export default config;
