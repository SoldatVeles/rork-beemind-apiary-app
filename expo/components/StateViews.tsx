import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import Colors from "../constants/colors";

interface EmptyStateProps {
  icon: React.ReactElement;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function EmptyState({ icon, title, message, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View style={styles.empty} testID={testID ?? "empty-state"}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85} testID={`${testID ?? "empty-state"}-action`}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface LoadingStateProps {
  message?: string;
  testID?: string;
}

export function LoadingState({ message, testID }: LoadingStateProps) {
  return (
    <View style={styles.center} testID={testID ?? "loading-state"}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      {message ? <Text style={styles.loadingText}>{message}</Text> : null}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  testID?: string;
}

export function ErrorState({ title, message, onRetry, retryLabel, testID }: ErrorStateProps) {
  return (
    <View style={styles.empty} testID={testID ?? "error-state"}>
      <View style={[styles.iconWrap, styles.iconWrapError]}>
        <AlertTriangle size={36} color={Colors.light.error} />
      </View>
      <Text style={styles.title}>{title ?? "Something went wrong"}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.85} testID={`${testID ?? "error-state"}-retry`}>
          <Text style={styles.buttonText}>{retryLabel ?? "Try again"}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 64,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  center: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconWrapError: {
    backgroundColor: Colors.light.error + "15",
    borderColor: Colors.light.error + "40",
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
    fontSize: 15,
  },
});
