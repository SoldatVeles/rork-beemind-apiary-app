import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, CloudOff, RefreshCw, AlertTriangle } from "lucide-react-native";
import { useSync, type ConnectionStatus } from "@/store/sync-store";

const COLORS: Record<ConnectionStatus, { bg: string; fg: string; border: string }> = {
  online: { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
  offline: { bg: "#F3F4F6", fg: "#374151", border: "#E5E7EB" },
  syncing: { bg: "#EFF6FF", fg: "#1D4ED8", border: "#BFDBFE" },
  error: { bg: "#FEF2F2", fg: "#B91C1C", border: "#FECACA" },
};

const LABELS: Record<ConnectionStatus, string> = {
  online: "Online",
  offline: "Offline",
  syncing: "Syncing…",
  error: "Sync failed",
};

export interface ConnectionIndicatorProps {
  /** When true, only show the pill if user is offline / has pending items / sync failed. */
  compact?: boolean;
}

export default function ConnectionIndicator({ compact = false }: ConnectionIndicatorProps) {
  const { status, queueCount, retry, lastError } = useSync();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === "syncing") {
      Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true }),
      ).start();
    } else {
      spin.stopAnimation(() => spin.setValue(0));
    }
  }, [spin, status]);

  if (compact && status === "online" && queueCount === 0) {
    return null;
  }

  const palette = COLORS[status];
  const baseLabel = LABELS[status];
  const label =
    queueCount > 0 && status !== "syncing"
      ? `${baseLabel} • ${queueCount} pending`
      : baseLabel;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const Icon = (() => {
    switch (status) {
      case "online":
        return <CheckCircle2 size={14} color={palette.fg} />;
      case "offline":
        return <CloudOff size={14} color={palette.fg} />;
      case "syncing":
        return (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <RefreshCw size={14} color={palette.fg} />
          </Animated.View>
        );
      case "error":
        return <AlertTriangle size={14} color={palette.fg} />;
    }
  })();

  const showRetry = status === "error" || (status === "offline" && queueCount > 0);

  return (
    <View
      testID="connection-indicator"
      style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }]}
    >
      {Icon}
      <Text style={[styles.label, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
      {showRetry && (
        <Pressable
          testID="connection-indicator-retry"
          onPress={() => retry()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.retry, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.retryText, { color: palette.fg }]}>Retry</Text>
        </Pressable>
      )}
      {!!lastError && status === "error" && (
        <Text style={[styles.error, { color: palette.fg }]} numberOfLines={1}>
          {lastError}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    alignSelf: "flex-start" as const,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  retry: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "700" as const,
    textDecorationLine: "underline" as const,
  },
  error: {
    fontSize: 11,
    marginLeft: 4,
    maxWidth: 120,
  },
});
