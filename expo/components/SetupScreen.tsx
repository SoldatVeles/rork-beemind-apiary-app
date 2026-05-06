import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import * as Updates from "expo-updates";
import { AlertTriangle, RefreshCw } from "lucide-react-native";

type Props = {
  missing: string[];
};

export default function SetupScreen({ missing }: Props) {
  const onReload = async () => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.location.reload();
        return;
      }
      await Updates.reloadAsync();
    } catch (e) {
      console.log("[SetupScreen] reload failed", e);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="setup-screen"
    >
      <View style={styles.iconWrap}>
        <AlertTriangle size={40} color="#B45309" />
      </View>
      <Text style={styles.title}>Supabase setup required</Text>
      <Text style={styles.subtitle}>
        BeeMind needs your Supabase project credentials to start.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Missing environment variable(s)</Text>
        {missing.map((m) => (
          <Text key={m} style={styles.code}>
            {m}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How to fix in Rork</Text>
        <Text style={styles.step}>
          1. Open your Rork project → Settings → Environment Variables.
        </Text>
        <Text style={styles.step}>
          2. Add{" "}
          <Text style={styles.codeInline}>EXPO_PUBLIC_SUPABASE_URL</Text> and{" "}
          <Text style={styles.codeInline}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>{" "}
          from Supabase → Project Settings → API.
        </Text>
        <Text style={styles.step}>
          3. Fully restart the preview (a hot reload is not enough — Expo only
          reads env vars at startup).
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local development fallback</Text>
        <Text style={styles.step}>
          Copy <Text style={styles.codeInline}>lib/env.example.ts</Text> to{" "}
          <Text style={styles.codeInline}>lib/env.local.ts</Text> and fill in
          your values. That file is gitignored.
        </Text>
      </View>

      <Pressable
        onPress={onReload}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        testID="setup-reload-button"
      >
        <RefreshCw size={18} color="#fff" />
        <Text style={styles.buttonText}>Reload app</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFCE8",
  },
  content: {
    padding: 24,
    paddingTop: 72,
    paddingBottom: 64,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF3C7",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 8,
  },
  step: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 6,
  },
  code: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    color: "#B45309",
    backgroundColor: "#FEF3C7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start" as const,
  },
  codeInline: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    color: "#92400E",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#F59E0B",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
