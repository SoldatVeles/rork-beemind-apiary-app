import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LanguageProvider, useLanguage } from "@/store/language-store";
import { AuthProvider } from "@/store/auth-store";
import { BeeMindProvider } from "@/store/beemind-context";
import { ProProvider } from "@/store/pro-store";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { getSupabaseConfig } from "@/lib/env";
import SetupScreen from "@/components/SetupScreen";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5000,
      networkMode: "offlineFirst",
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="diagnostics"
        options={{
          title: "System Diagnostics",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

function AppContent() {
  const { isLoading } = useLanguage();

  useEffect(() => {
    async function setupApp() {
      try {
        if (__DEV__) {
          console.log("[App] Running in development mode");
        }

        if (!__DEV__ && Updates.isEnabled) {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            }
          } catch (updateError) {
            console.log("[App] Update check failed:", updateError);
          }
        }
      } catch (error) {
        console.error("[App] Setup error:", error);
      }
    }

    setupApp();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const cfg = getSupabaseConfig();

  useEffect(() => {
    if (!cfg.ok) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [cfg.ok]);

  if (!cfg.ok) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SetupScreen missing={cfg.missing} issues={cfg.issues} />
      </GestureHandlerRootView>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <BeeMindProvider>
            <ProProvider>
              <AppContent />
            </ProProvider>
          </BeeMindProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#FEFCE8",
  },
});
