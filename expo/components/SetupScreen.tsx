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
import { AlertTriangle, RefreshCw, CheckCircle2, XCircle } from "lucide-react-native";
import { getEnvDebugInfo, logEnvDebugDump, type ValidationIssue } from "@/lib/env";

type Props = {
  missing: string[];
  issues?: ValidationIssue[];
};

export default function SetupScreen({ missing, issues }: Props) {
  const debug = React.useMemo(() => getEnvDebugInfo(), []);
  React.useEffect(() => {
    logEnvDebugDump("SetupScreen mounted");
  }, []);
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
        <Text style={styles.cardTitle}>Configuration issues</Text>
        {(issues && issues.length > 0
          ? issues
          : missing.map((m) => ({
              variable: m as ValidationIssue["variable"],
              reason: "missing" as const,
              message: `${m} is not set.`,
            }))
        ).map((i) => (
          <View key={`${i.variable}-${i.reason}`} style={{ marginBottom: 8 }}>
            <Text style={styles.code}>{i.variable}</Text>
            <Text style={styles.muted}>
              {i.reason.replace("_", " ")}: {i.message}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Environment variable status</Text>
        <EnvRow
          name="EXPO_PUBLIC_SUPABASE_URL"
          defined={debug.processEnvUrlDefined}
        />
        <EnvRow
          name="EXPO_PUBLIC_SUPABASE_ANON_KEY"
          defined={debug.processEnvAnonKeyDefined}
        />
        <Text style={styles.muted}>
          Resolved url from: {debug.resolvedFrom.url ?? "none"}
          {"  \u2022  "}anon key from: {debug.resolvedFrom.anonKey ?? "none"}
        </Text>
        <Text style={styles.muted}>
          URL preview: {debug.resolvedUrlPreview ?? "(none)"} ({debug.trimmedUrlLength} chars)
        </Text>
        <Text style={styles.muted}>
          Anon key preview: {debug.resolvedAnonKeyPreview ?? "(none)"}
        </Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>
          All EXPO_PUBLIC_* keys visible to the app:
        </Text>
        <Text style={styles.code}>
          {debug.publicEnvKeys.length > 0 ? debug.publicEnvKeys.join("\n") : "(none)"}
        </Text>
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

function EnvRow({ name, defined }: { name: string; defined: boolean }) {
  const Icon = defined ? CheckCircle2 : XCircle;
  const color = defined ? "#16A34A" : "#DC2626";
  return (
    <View style={envRowStyles.row} testID={`env-row-${name}`}>
      <Icon size={16} color={color} />
      <Text style={envRowStyles.name}>{name}</Text>
      <Text style={[envRowStyles.status, { color }]}>
        {defined ? "defined" : "undefined"}
      </Text>
    </View>
  );
}

const envRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingVertical: 4,
  },
  name: {
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: "#111827",
  },
  status: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
});

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
  muted: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
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
