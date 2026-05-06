import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "BeeMind",
  slug: "beemind",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "beemind",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FFF8E7",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.beemind.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#F5B800",
    },
    package: "com.beemind.app",
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: "https://rork.com/",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Mirror EXPO_PUBLIC_* into Constants.expoConfig.extra so the app can
    // fall back to it when process.env is stripped at runtime.
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
});
