import React, { useMemo, useRef } from "react";
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
import { useBeeMind } from "../../store/beemind-context";
import { useUserPreferences } from "../../store/user-preferences-store";
import { useLanguage } from "../../store/language-store";
import type { TranslationKeys } from "../../constants/translations";

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

type HomeTranslation = TranslationKeys["home"];
type VitalityStatusKey = keyof HomeTranslation["vitality"]["statuses"];

interface ColonyVitality {
  score: number;
  statusKey: VitalityStatusKey;
}

const templateReplace = (template: string, replacements: Record<string, string>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_match, key) => replacements[key] ?? "");

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

function formatRelativeDate(home: HomeTranslation, iso?: string) {
  if (!iso) {
    return home.relativeDates.noRecord;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return home.relativeDates.noRecord;
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 0) {
    return home.today;
  }
  if (diffDays === 1) {
    return home.yesterday;
  }
  if (diffDays === -1) {
    return home.tomorrow;
  }
  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} ${home.daysAgo}`;
  }
  if (diffDays < -1 && diffDays > -7) {
    return `${home.inDays} ${Math.abs(diffDays)} ${home.futureDaysSuffix}`;
  }
  return date.toLocaleDateString();
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const homeStrings = t.home;
  const { tasks, inspections, hives, harvests } = useBeeMind();
  const { hasCompletedOnboarding } = useUserPreferences();

  console.log(
    "[HomeScreen] tasks",
    tasks.length,
    "inspections",
    inspections.length,
    "harvests",
    harvests.length
  );

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
    return [...scheduled].sort(
      (a, b) => new Date(a.due_at ?? 0).getTime() - new Date(b.due_at ?? 0).getTime()
    )[0];
  }, [pendingTasks]);

  const honeyYield = useMemo(
    () => harvests.reduce((sum, harvest) => sum + harvest.weight_kg, 0),
    [harvests]
  );
  const latestHarvest = useMemo(() => {
    if (harvests.length === 0) {
      return undefined;
    }
    return [...harvests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }, [harvests]);

  const colonyVitality = useMemo<ColonyVitality>(() => {
    if (inspections.length === 0) {
      return {
        score: 72,
        statusKey: "momentum",
      };
    }

    const broodScore =
      inspections.reduce((acc, inspection) => {
        if (inspection.brood_pattern === "solid") {
          return acc + 1;
        }
        if (inspection.brood_pattern === "spotty") {
          return acc + 0.6;
        }
        return acc + 0.3;
      }, 0) / inspections.length;

    const averageTemper =
      inspections.reduce((acc, inspection) => acc + (inspection.temper ?? 3), 0) /
      inspections.length;
    const averageMites =
      inspections.reduce((acc, inspection) => acc + (inspection.mites_per_100 ?? 0), 0) /
      inspections.length;

    const score = Math.max(
      45,
      Math.min(98, Math.round(62 + broodScore * 11 + averageTemper * 4 - averageMites * 3))
    );

    let statusKey: VitalityStatusKey = "healthy";
    if (score >= 90) {
      statusKey = "thriving";
    } else if (score <= 65) {
      statusKey = "watchlist";
    }

    return {
      score,
      statusKey,
    };
  }, [inspections]);

  const daysSinceInspection = useMemo(() => {
    if (inspections.length === 0) {
      return homeStrings.noInspections;
    }
    const recent = [...inspections].sort(
      (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
    )[0];
    return formatRelativeDate(homeStrings, recent.performed_at);
  }, [homeStrings, inspections]);

  const quickActions = useMemo<QuickActionConfig[]>(
    () => [
      {
        id: "log-inspection",
        label: homeStrings.quickActions.actions.logInspection.label,
        caption: homeStrings.quickActions.actions.logInspection.caption,
        route: "/inspection/new",
        icon: <Activity size={20} color={Colors.light.primary} />,
      },
      {
        id: "plan-task",
        label: homeStrings.quickActions.actions.planTask.label,
        caption: homeStrings.quickActions.actions.planTask.caption,
        route: "/(tabs)/tasks",
        icon: <CalendarCheck size={20} color={Colors.light.primary} />,
      },
      {
        id: "review-hives",
        label: homeStrings.quickActions.actions.reviewHives.label,
        caption: homeStrings.quickActions.actions.reviewHives.caption,
        route: "/(tabs)/hives",
        icon: <Hexagon size={20} color={Colors.light.primary} />,
      },
    ], [homeStrings.quickActions.actions]
  );

  const vitalityCopy = homeStrings.vitality.statuses[colonyVitality.statusKey];

  const insights = useMemo<InsightConfig[]>(() => {
    const harvestHint = latestHarvest
      ? templateReplace(homeStrings.insights.harvest.hintWithData, {
          relative: formatRelativeDate(homeStrings, latestHarvest.created_at),
          weight: latestHarvest.weight_kg.toFixed(1),
        })
      : homeStrings.insights.harvest.hintNoData;

    const taskHint = upcomingTask
      ? templateReplace(homeStrings.insights.tasks.hintWithData, {
          title: upcomingTask.title,
          relative: formatRelativeDate(homeStrings, upcomingTask.due_at),
        })
      : homeStrings.insights.tasks.hintNoData;

    const growthHint = templateReplace(homeStrings.insights.growth.hint, {
      completed: String(completedTasksCount),
      total: String(tasks.length),
    });

    return [
      {
        id: "harvest-trend",
        title: homeStrings.insights.harvest.title,
        value: `${honeyYield.toFixed(1)} ${homeStrings.metrics.honeyYieldUnit}`,
        hint: harvestHint,
        icon: <Droplet size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/harvests",
      },
      {
        id: "task-focus",
        title: homeStrings.insights.tasks.title,
        value: `${pendingTasks.length} ${homeStrings.metrics.openSuffix}`,
        hint: taskHint,
        icon: <CalendarCheck size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/tasks",
      },
      {
        id: "vitality",
        title: homeStrings.insights.vitality.title,
        value: `${colonyVitality.score}`,
        hint: vitalityCopy.narrative,
        icon: <Leaf size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/hives",
      },
      {
        id: "growth",
        title: homeStrings.insights.growth.title,
        value: `${taskCompletionRate}%`,
        hint: growthHint,
        icon: <TrendingUp size={18} color={Colors.light.secondary} />,
        route: "/(tabs)/inventory",
      },
    ];
  }, [
    colonyVitality.score,
    homeStrings,
    honeyYield,
    latestHarvest,
    pendingTasks.length,
    taskCompletionRate,
    tasks.length,
    upcomingTask,
    vitalityCopy.narrative,
    completedTasksCount,
  ]);

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
        colors={[
          Colors.light.primary + "66",
          Colors.light.secondary + "33",
          Colors.light.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: 40 + insets.top }]}
        testID="dashboard-hero"
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroEyebrow}>{homeStrings.hero.eyebrow}</Text>
            <Text style={styles.heroTitle}>{vitalityCopy.title}</Text>
            <Text style={styles.heroSubtitle}>{vitalityCopy.narrative}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>{colonyVitality.score}</Text>
            <Text style={styles.scoreLabel}>{homeStrings.hero.vitalityLabel}</Text>
          </View>
        </View>
        <View style={styles.heroMetricRow}>
          <View style={styles.heroMetricCard} testID="metric-active-hives">
            <Hexagon size={18} color={Colors.light.text} />
            <Text style={styles.metricLabel}>{homeStrings.activeHives}</Text>
            <Text style={styles.metricValue}>{hives.length}</Text>
          </View>
          <View style={styles.heroMetricCard} testID="metric-honey-yield">
            <Droplet size={18} color={Colors.light.text} />
            <Text style={styles.metricLabel}>{homeStrings.metrics.honeyYieldLabel}</Text>
            <Text style={styles.metricValue}>
              {honeyYield.toFixed(1)} {homeStrings.metrics.honeyYieldUnit}
            </Text>
          </View>
          <View style={styles.heroMetricCard} testID="metric-task-rate">
            <TrendingUp size={18} color={Colors.light.text} />
            <Text style={styles.metricLabel}>{homeStrings.metrics.taskVelocityLabel}</Text>
            <Text style={styles.metricValue}>{taskCompletionRate}%</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section} testID="operations-section">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{homeStrings.operations.title}</Text>
          <Text style={styles.sectionHint}>{homeStrings.operations.subtitle}</Text>
        </View>
        <View style={styles.timelineCard}>
          <View style={styles.timelineRow}>
            <CalendarCheck size={18} color={Colors.light.secondary} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>{homeStrings.operations.nextTaskLabel}</Text>
              <Text style={styles.timelineValue}>
                {upcomingTask ? upcomingTask.title : homeStrings.operations.noTaskTitle}
              </Text>
              <Text style={styles.timelineHint}>
                {upcomingTask
                  ? `${homeStrings.operations.duePrefix} ${formatRelativeDate(
                      homeStrings,
                      upcomingTask.due_at
                    )}`
                  : homeStrings.operations.createTaskHint}
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
              <Text style={styles.timelineLabel}>{homeStrings.operations.inspectionLabel}</Text>
              <Text style={styles.timelineValue}>{daysSinceInspection}</Text>
              <Text style={styles.timelineHint}>{homeStrings.operations.inspectionHint}</Text>
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
          <Text style={styles.sectionTitle}>{homeStrings.quickActions.title}</Text>
          <Text style={styles.sectionHint}>{homeStrings.quickActions.subtitle}</Text>
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
          <Text style={styles.sectionTitle}>{homeStrings.insights.title}</Text>
          <Text style={styles.sectionHint}>{homeStrings.insights.subtitle}</Text>
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
