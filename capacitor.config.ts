import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Unique app identifier — change com.webidoo.webimatch if you publish to stores
  appId: "com.webidoo.webimatch",
  appName: "Webi Match",
  // Vite build output directory
  webDir: "dist",
  // Bundle the web assets inside the native app (no live server needed)
  bundledWebRuntime: false,
  server: {
    // Set to true only during development on a device connected to the same Wi-Fi
    // as your machine; comment out for production builds.
    // androidScheme: "http",
    // url: "http://192.168.x.x:8080",
  },
  android: {
    // Full-screen kiosk feel on Android tablets
    backgroundColor: "#0d1117",
  },
  ios: {
    // Extend layout into the safe area on notched iPhones / iPad Pro
    contentInset: "automatic",
    backgroundColor: "#0d1117",
  },
};

export default config;
