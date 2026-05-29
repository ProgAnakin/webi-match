import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.annichini.webimatch",
  appName: "Webi Match",
  webDir: "dist",
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
