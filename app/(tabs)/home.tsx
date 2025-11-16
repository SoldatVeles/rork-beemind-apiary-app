import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  Droplet,
  Hexagon,
  Leaf,
  TrendingUp,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../constants/colors";
import { useBeeMindStore } from "../../store/beemind-store";
import { useUserPreferences } from "../../store/user-preferences-store";

interface InsightConfig {
  id: string;
  title: string;
  value: string;
  hint: string;
  icon: React.ReactElement;
  route?: string;
}

interface QuickActionConfig {
  id: string;
  label: string;
  caption: string;
  route: string;
  icon: React.ReactElement;
}

interface InteractiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  testID: string;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
}

function InteractiveCard({ children, onPress, testID, style, pressedStyle }: InteractiveCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={[styles.interactiveCardWrapper, { transform: [{ scale }] }]} testID={`${testID}-wrapper`}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: Colors.light.secondary + "33" }}
        style={({ pressed }) => [
          styles.interactiveCard,
          style,
          pressed && styles.interactiveCardPressed,
          pressed && pressedStyle,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function formatRelativeDate(iso?: string) {
  if (!iso) {
    return "No record";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "No record";
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, inspections, hives, harvests, loadSeedData } = useBeeMindStore();
  const { hasCompletedOnboarding } = useUserPreferences();

  useEffect(() => {
    if (hives.length === 0) {
      console.log("[HomeScreen] Seeding sample data for pristine state");
      loadSeedData();
    }
  }, [hives.length, loadSeedData]);

  console.log("[HomeScreen] tasks", tasks.length, "inspections", inspections.length, "harvests", harvests.length);

  const pendingTasks = useMemo(() => tasks.filter((task) => !task.is_done), [tasks]);
  const completedTasksCount = useMemo(() => tasks.filter((task) => task.is_done).length, [tasks]);
  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }
    return Math.min(100, Math.round((completedTasksCount / tasks.length) * 100));
  }, [completedTasksCount, tasks.length]);

  const upcomingTask = useMemo(() => {
    const scheduled = pendingTasks.filter((task) => Boolean(task.due_at));
    if (scheduled.length === 0) {
      return undefined;
    }
    return [...scheduled].sort((a, b) => new Date(a.due_at ?? 0).getTime() - new Date(b.due_at ?? 0).getTime())[0];
  }, [pendingTasks]);

  const honeyYield = useMemo(() => harvests.reduce((sum, harvest) => sum + harvest.weight_kg, 0), [harvests]);
  const latestHarvest = useMemo(() => {
    if (harvests.length === 0) {
      return undefined;
    }
    return [...harvests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [harvests]);

  const colonyVitality = useMemo(() => {
    if (inspections.length === 0) {
      return {
        score: 72,
        status: "Momentum Building",
        narrative: "Log a focused inspection to unlock deeper vitality analytics.",
      };
    }
    const broodScore = inspections.reduce((acc, inspection) => {
      if (inspection.brood_pattern === "solid") {
        return acc + 1;
      }
      if (inspection.brood_pattern === "spotty") {
        return acc + 0.6;
      }
      return acc + 0.3;
    }, 0) / inspections.length;

    const averageTemper = inspections.reduce((acc, inspection) => acc + (inspection.temper ?? 3), 0) / inspections.length;
    const averageMites = inspections.reduce((acc, inspection) => acc + (inspection.mites_per_100 ?? 0), 0) / inspections.length;

    const score = Math.max(45, Math.min(98, Math.round(62 + broodScore * 11 + averageTemper * 4 - averageMites * 3)));

    let status = "Healthy Trajectory";
    if (score >= 90) {
      status = "Thriving Signal";
    } else if (score <= 65) {
      status = "Watchlist";
    }

    const narrative = score >= 90
      ? "Colonies are peaking. Keep momentum with light-touch inspections."
      : score <= 65
      ? "Varroa or nutrition may need attention in the next run."
      : "Cadence looks balanced. Continue the current inspection rhythm.";

    return {
      score,
      status,
      narrative,
    };
  }, [inspections]);

  const daysSinceInspection = useMemo(() => {
    if (inspections.length === 0) {
      return "No inspections yet";
    }
    const recent = [...inspections].sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())[0];
    return formatRelativeDate(recent.performed_at);
  }, [inspections]);

  const quickActions: QuickActionConfig[] = useMemo(
    () => [
      {
        id: "log-inspection",
        label: "Log Inspection",
        caption: "Capture brood, mites, and mood snapshot",
        route: "/inspection/new",
        icon: <Activity size={20} color={Colors.light.primary} />,
      },
      {
        id: "plan-task",
        label: "Plan Task",
        caption: "Stack upcoming work into focused bursts",
        route: "/(tabs)/tasks",
        icon: <CalendarCheck size={20} color={Colors.light.primary} />,
      },
      {
        id: "review-hives",
        label: "Review Hives",
        caption: "Drill into colony narratives and signals",
        route: "/(tabs)/hives",
        icon: <Hexagon size={20} color={Colors.light.primary} />,
      },
    ],
    [router]
  );

  const insights: InsightConfig[] = useMemo(
    () => [
      {
        id: "harvest-trend",
        title: "Harvest Momentum",
        value: `${honeyYield.toFixed(1)} kg`,
        hint: latestHarvest
          ? `Last pull ${formatRelativeDate(latestHarvest.created_at)} • ${latestHarvest.weight_kg.toFixed(1)} kg`
          : "Log your first harvest to unlock projections",
        icon: <Droplet size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/harvests",
      },
      {
        id: "task-focus",
        title: "Task Focus",
        value: `${pendingTasks.length} open`,
        hint: upcomingTask
          ? `${upcomingTask.title} • due ${formatRelativeDate(upcomingTask.due_at)}`
          : "Design your next sprint to stay ahead",
        icon: <CalendarCheck size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/tasks",
      },
      {
        id: "vitality",
        title: "Vitality Index",
        value: `${colonyVitality.score}`,
        hint: colonyVitality.narrative,
        icon: <Leaf size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/hives",
      },
      {
        id: "growth",
        title: "Growth Velocity",
        value: `${taskCompletionRate}% accomplished`,
        hint: `${completedTasksCount} completed • ${tasks.length} total tasks`,
        icon: <TrendingUp size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/inventory",
      },
    ],
    [
      colonyVitality.narrative,
      colonyVitality.score,
      completedTasksCount,
      honeyYield,
      latestHarvest,
      pendingTasks.length,
      taskCompletionRate,
      tasks.length,
      upcomingTask,
    ]
  );

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="dashboard-scroll"
    >
      <LinearGradient
        colors={[Colors.light.primary + "66", Colors.light.secondary + "33", Colors.light.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: 40 + insets.top }]}
        testID="dashboard-hero"
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroEyebrow}>Apiary Mission Control</Text>
            <Text style={styles.heroTitle}>{colonyVitality.status}</Text>
            <Text style={styles.heroSubtitle}>{colonyVitality.narrative}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>{colonyVitality.score}</Text>
            <Text style={styles.scoreLabel}>Vitality</Text>
          </View>
        </View>
        <View style={styles.heroMetricRow}>
          <View style={styles.heroMetricCard} testID="metric-active-hives">
            <Hexagon size={18} color={Colors.light.text} />
            <Text style={styles.metricLabel}>Active Hives</Text>
            <Text style={styles.metricValue}>{hives.length}</Text>
          </View>
          <View style={styles.heroMetricCard} testID="metric-honey-yield">
            <Droplet size={18} color={Colors.light.text} />
            <Text style={styles.metricLabel}>Honey Yield</Text>
            <Text style={styles.metricValue}>{honeyYield.toFixed(1)} kg</Text>
          </View>
          <View style={styles.heroMetricCard} testID="metric-task-rate">
            <TrendingUp size={18} color={Colors.light.text} />
            <Text style={styles.metricLabel}>Task Velocity</Text>
            <Text style={styles.metricValue}>{taskCompletionRate}%</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section} testID="operations-section">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Operations Pulse</Text>
          <Text style={styles.sectionHint}>Track the next critical move</Text>
        </View>
        <View style={styles.timelineCard}>
          <View style={styles.timelineRow}>
            <CalendarCheck size={18} color={Colors.light.secondary} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Next Task</Text>
              <Text style={styles.timelineValue}>{upcomingTask ? upcomingTask.title : "No task scheduled"}</Text>
              <Text style={styles.timelineHint}>
                {upcomingTask ? `Due ${formatRelativeDate(upcomingTask.due_at)}` : "Create a task to anchor the week"}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/tasks")}
              testID="timeline-task-action"
              style={styles.chevronButton}
            >
              <ArrowRight size={18} color={Colors.light.text} />
            </Pressable>
          </View>
          <View style={styles.timelineDivider} />
          <View style={styles.timelineRow}>
            <Activity size={18} color={Colors.light.secondary} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Inspection Rhythm</Text>
              <Text style={styles.timelineValue}>{daysSinceInspection}</Text>
              <Text style={styles.timelineHint}>Maintain cadence for consistent brood lift</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/hives")}
              testID="timeline-inspection-action"
              style={styles.chevronButton}
            >
              <ArrowRight size={18} color={Colors.light.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section} testID="quick-actions-section">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionHint}>Launch the workflows that keep you ahead</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <InteractiveCard
              key={action.id}
              testID={`quick-action-${action.id}`}
              onPress={() => router.push(action.route)}
            >
              <View style={styles.quickActionIcon}>{action.icon}</View>
              <View style={styles.quickActionTextBlock}>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionCaption}>{action.caption}</Text>
              </View>
              <ArrowRight size={16} color={Colors.light.tabIconDefault} />
            </InteractiveCard>
          ))}
        </View>
      </View>

      <View style={styles.section} testID="insights-section">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Insight Tiles</Text>
          <Text style={styles.sectionHint}>Signal-rich cards updating in real time</Text>
        </View>
        <View style={styles.insightsGrid}>
          {insights.map((insight) => (
            <InteractiveCard
              key={insight.id}
              testID={`insight-${insight.id}`}
              onPress={() => {
                if (insight.route) {
                  router.push(insight.route);
                }
              }}
              style={styles.insightCard}
              pressedStyle={styles.insightCardPressed}
            >
              <View style={styles.insightIcon}>{insight.icon}</View>
              <View style={styles.insightTextBlock}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightValue}>{insight.value}</Text>
                <Text style={styles.insightHint}>{insight.hint}</Text>
              </View>
            </InteractiveCard>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  heroTitleBlock: {
    flex: 1,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.light.tabIconDefault,
    fontWeight: "600" as const,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.tabIconDefault,
  },
  scoreBadge: {
    width: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  heroMetricRow: {
    flexDirection: "row",
    gap: 16,
  },
  heroMetricCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
  },
  timelineCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  timelineValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  timelineHint: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
  },
  timelineDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.secondary + "22",
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.secondary + "22",
  },
  quickActionTextBlock: {
    flex: 1,
    gap: 4,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  quickActionCaption: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
  },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  insightCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flex: 1,
    minWidth: "48%",
  },
  insightCardPressed: {
    borderColor: Colors.light.secondary,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.secondary + "22",
  },
  insightTextBlock: {
    gap: 4,
  },
  insightTitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  insightHint: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    lineHeight: 18,
  },
  interactiveCardWrapper: {
    borderRadius: 20,
  },
  interactiveCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
  },
  interactiveCardPressed: {
    borderColor: Colors.light.secondary,
  },
});
