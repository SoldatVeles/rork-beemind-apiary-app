import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, AlertTriangle, LoaderCircle, RefreshCw, ShieldCheck, XCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/store/auth-store";
import { useLanguage } from "@/store/language-store";
import { useBeeMind } from "@/store/beemind-context";
import { useUserPreferences } from "@/store/user-preferences-store";

const statusMeta = {
  pass: {
    label: "Pass",
    color: "#22C55E",
    Icon: CheckCircle2,
  },
  warning: {
    label: "Warning",
    color: "#FBBF24",
    Icon: AlertTriangle,
  },
  fail: {
    label: "Fail",
    color: "#F87171",
    Icon: XCircle,
  },
  pending: {
    label: "Pending",
    color: "#38BDF8",
    Icon: LoaderCircle,
  },
} as const;

type CheckStatus = keyof typeof statusMeta;

interface DiagnosticCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

interface DiagnosticSection {
  key: string;
  title: string;
  subtitle: string;
  checks: DiagnosticCheck[];
}

const translationProbes: readonly string[][] = [
  ["settings", "account"],
  ["settings", "signOut"],
  ["settings", "signOutConfirm"],
  ["settings", "signOutMessage"],
  ["yards", "mapHelper"],
  ["yards", "quickCreateTitle"],
  ["yards", "heroSubtitleWithCount"],
  ["home", "hero", "eyebrow"],
  ["home", "quickActions", "title"],
  ["tasks", "createTask"],
];

function getNestedValue(source: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export default function DiagnosticsScreen() {
  const { session, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const { language, isLoading: languageLoading, t } = useLanguage();
  const { yards, hives, tasks, inspections, harvests, inventory, queens, refetch, isLoading: dataLoading } = useBeeMind();
  const preferences = useUserPreferences();
  const insets = useSafeAreaInsets();
  const [lastRun, setLastRun] = useState<Date>(() => new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const translationInsights = useMemo(() => {
    const missing = translationProbes.filter((probe) => getNestedValue(t, probe) === undefined);
    return {
      total: translationProbes.length,
      missing,
    };
  }, [t]);

  const datasetCounts = useMemo(
    () => ({
      yards: yards.length,
      hives: hives.length,
      tasks: tasks.length,
      inspections: inspections.length,
      queens: queens.length,
      harvests: harvests.length,
      inventory: inventory.length,
    }),
    [yards.length, hives.length, tasks.length, inspections.length, queens.length, harvests.length, inventory.length]
  );

  const yardFeatureAccessible = preferences.canAccessFeature("yard_management");
  const experienceLevel = preferences.experienceLevel ?? "unset";

  const sections = useMemo<DiagnosticSection[]>(() => {
    const authChecks: DiagnosticCheck[] = [
      {
        id: "auth-session",
        label: "Session state",
        status: authLoading ? "pending" : isAuthenticated ? "pass" : "fail",
        detail: isAuthenticated
          ? `Authenticated as ${session?.user?.email ?? "unknown user"}`
          : "No active Supabase session",
      },
      {
        id: "auth-error",
        label: "Auth errors",
        status: authError ? "warning" : "pass",
        detail: authError ?? "No errors logged",
      },
    ];

    const languageChecks: DiagnosticCheck[] = [
      {
        id: "language-selected",
        label: "Selected language",
        status: languageLoading ? "pending" : "pass",
        detail: language.toUpperCase(),
      },
      {
        id: "language-coverage",
        label: "Translation coverage",
        status: translationInsights.missing.length === 0 ? "pass" : "warning",
        detail: `${translationProbes.length - translationInsights.missing.length}/${translationProbes.length} keys available`,
      },
    ];

    const dataChecks: DiagnosticCheck[] = [
      {
        id: "data-yards",
        label: "Yards dataset",
        status: datasetCounts.yards > 0 ? "pass" : "warning",
        detail: `${datasetCounts.yards} record(s) loaded`,
      },
      {
        id: "data-hives",
        label: "Hives dataset",
        status: datasetCounts.hives > 0 ? "pass" : "warning",
        detail: `${datasetCounts.hives} record(s) loaded`,
      },
      {
        id: "data-queens",
        label: "Queens dataset",
        status: datasetCounts.queens > 0 ? "pass" : "warning",
        detail: `${datasetCounts.queens} record(s) loaded`,
      },
      {
        id: "data-tasks",
        label: "Tasks dataset",
        status: datasetCounts.tasks > 0 ? "pass" : "warning",
        detail: `${datasetCounts.tasks} record(s) loaded`,
      },
      {
        id: "data-inspections",
        label: "Inspections dataset",
        status: datasetCounts.inspections > 0 ? "pass" : "warning",
        detail: `${datasetCounts.inspections} record(s) loaded`,
      },
      {
        id: "data-harvests",
        label: "Harvests dataset",
        status: datasetCounts.harvests > 0 ? "pass" : "warning",
        detail: `${datasetCounts.harvests} record(s) loaded`,
      },
      {
        id: "data-inventory",
        label: "Inventory dataset",
        status: datasetCounts.inventory > 0 ? "pass" : "warning",
        detail: `${datasetCounts.inventory} record(s) loaded`,
      },
    ];

    return [
      {
        key: "auth",
        title: "Authentication",
        subtitle: "Supabase connectivity + session health",
        checks: authChecks,
      },
      {
        key: "language",
        title: "Localization",
        subtitle: "Language selector & translation payloads",
        checks: languageChecks,
      },
      {
        key: "data",
        title: "Data layers",
        subtitle: "React Query caches & entity availability",
        checks: dataChecks,
      },
      {
        key: "experience",
        title: "Experience-level gates",
        subtitle: "Feature availability per onboarding level",
        checks: [
          {
            id: "experience-current",
            label: "Current level",
            status: experienceLevel === "unset" ? "pending" : "pass",
            detail: experienceLevel === "unset" ? "Not selected" : experienceLevel,
          },
          {
            id: "experience-yard-access",
            label: "Beginner yard access",
            status: experienceLevel === "beginner" ? (yardFeatureAccessible ? "pass" : "fail") : "warning",
            detail:
              experienceLevel === "beginner"
                ? yardFeatureAccessible
                  ? "Beginner can create & edit yards"
                  : "Beginner level currently blocked from yard_management"
                : "Switch to Beginner to validate this gate",
          },
        ],
      },
      {
        key: "platform",
        title: "Platform coverage",
        subtitle: "Runtime-specific requirements",
        checks: [
          {
            id: "platform-runtime",
            label: "Runtime",
            status: "pass",
            detail: Platform.select({ ios: "iOS", android: "Android", web: "Web", default: "Native" }) ?? "Unknown",
          },
          {
            id: "platform-map",
            label: "Map fallback",
            status: Platform.OS === "web" ? "warning" : "pass",
            detail:
              Platform.OS === "web"
                ? "Web build renders placeholder guidance instead of native map"
                : "Native map components active",
          },
        ],
      },
    ];
  }, [
    authLoading,
    isAuthenticated,
    session?.user?.email,
    authError,
    language,
    languageLoading,
    translationInsights.missing.length,
    datasetCounts.yards,
    datasetCounts.hives,
    datasetCounts.queens,
    datasetCounts.tasks,
    datasetCounts.inspections,
    datasetCounts.harvests,
    datasetCounts.inventory,
    experienceLevel,
    yardFeatureAccessible,
  ]);

  const handleRefresh = useCallback(async () => {
    console.log("[Diagnostics] Refresh requested");
    setRefreshing(true);
    try {
      await Promise.resolve(refetch());
    } catch (error) {
      console.error("[Diagnostics] Refresh failed", error);
    } finally {
      setLastRun(new Date());
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: 20 + insets.top,
          paddingBottom: 48 + insets.bottom,
        },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.light.primary} />}
      testID="diagnostics-scroll"
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <ShieldCheck size={16} color="#0F172A" />
          <Text style={styles.badgeText}>Automated QA snapshot</Text>
        </View>
        <Text style={styles.timestamp} testID="diagnostics-last-run">
          Last run • {lastRun.toLocaleTimeString()}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} activeOpacity={0.85} testID="diagnostics-refresh-button">
          <RefreshCw size={18} color="#0F172A" />
          <Text style={styles.refreshLabel}>Re-run checks</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard} testID="metric-total-records">
          <Text style={styles.metricLabel}>Records loaded</Text>
          <Text style={styles.metricValue}>{Object.values(datasetCounts).reduce((acc, value) => acc + value, 0)}</Text>
          <Text style={styles.metricHint}>{dataLoading ? "Fetching fresh data..." : "All queries resolved"}</Text>
        </View>
        <View style={styles.metricCard} testID="metric-translations">
          <Text style={styles.metricLabel}>Translations verified</Text>
          <Text style={styles.metricValue}>{translationProbes.length - translationInsights.missing.length}</Text>
          <Text style={styles.metricHint}>
            {translationInsights.missing.length === 0 ? "Complete" : `${translationInsights.missing.length} missing keys`}
          </Text>
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.key} style={styles.section} testID={`diagnostics-section-${section.key}`}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
          </View>
          {section.checks.map((check) => {
            const meta = statusMeta[check.status];
            const Icon = meta.Icon;
            return (
              <View key={check.id} style={styles.checkRow} testID={`diagnostics-check-${check.id}`}>
                <View style={[styles.statusBadge, { backgroundColor: `${meta.color}1A`, borderColor: `${meta.color}33` }]}>
                  <Icon size={16} color={meta.color} />
                  <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <View style={styles.checkContent}>
                  <Text style={styles.checkLabel}>{check.label}</Text>
                  <Text style={styles.checkDetail}>{check.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040B14",
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 48,
  },
  header: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#0F172A",
    letterSpacing: 0.4,
  },
  timestamp: {
    color: "rgba(226, 232, 240, 0.8)",
    fontSize: 14,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    backgroundColor: "#FACC15",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  refreshLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#0F172A",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0B1120",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  metricLabel: {
    color: "rgba(148, 163, 184, 0.9)",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  metricValue: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "700" as const,
    marginTop: 6,
  },
  metricHint: {
    color: "rgba(148, 163, 184, 0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  sectionSubtitle: {
    color: "rgba(148, 163, 184, 0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  checkRow: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#0B1329",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  checkContent: {
    flex: 1,
    gap: 2,
  },
  checkLabel: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  checkDetail: {
    color: "rgba(226, 232, 240, 0.75)",
    fontSize: 13,
  },
});
