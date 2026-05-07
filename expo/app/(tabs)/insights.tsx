import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Crown,
  Droplet,
  Hexagon,
  Lock,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "../../constants/colors";
import { useBeeMind } from "../../store/beemind-context";
import { usePro } from "../../store/pro-store";
import { useLanguage } from "../../store/language-store";

const QUEEN_AGE_WARN_DAYS = 365;
const INSPECTION_STALE_DAYS = 30;
const MS_DAY = 86400000;

interface MonthBucket {
  key: string;
  label: string;
  value: number;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleString(undefined, { month: "short" });
}

function lastNMonths(n: number): { key: string; label: string; date: Date }[] {
  const now = startOfMonth(new Date());
  const months: { key: string; label: string; date: Date }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: monthLabel(d),
      date: d,
    });
  }
  return months;
}

function bucketByMonth(items: { date: string }[], n: number): MonthBucket[] {
  const months = lastNMonths(n);
  const map = new Map<string, number>();
  months.forEach((m) => map.set(m.key, 0));
  for (const item of items) {
    const d = new Date(item.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return months.map((m) => ({
    key: m.key,
    label: m.label,
    value: map.get(m.key) ?? 0,
  }));
}

function sumByMonth(
  items: { date: string; amount: number }[],
  n: number
): MonthBucket[] {
  const months = lastNMonths(n);
  const map = new Map<string, number>();
  months.forEach((m) => map.set(m.key, 0));
  for (const item of items) {
    const d = new Date(item.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + item.amount);
    }
  }
  return months.map((m) => ({
    key: m.key,
    label: m.label,
    value: map.get(m.key) ?? 0,
  }));
}

interface BarChartProps {
  data: MonthBucket[];
  unit?: string;
  color: string;
  testID?: string;
}

function BarChart({ data, unit, color, testID }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.chartRow} testID={testID}>
      {data.map((d) => {
        const heightPct = (d.value / max) * 100;
        return (
          <View key={d.key} style={styles.chartCol}>
            <Text style={styles.chartValue} numberOfLines={1}>
              {d.value > 0 ? d.value.toFixed(d.value % 1 === 0 ? 0 : 1) : ""}
            </Text>
            <View style={styles.chartBarTrack}>
              <View
                style={[
                  styles.chartBarFill,
                  { height: `${Math.max(4, heightPct)}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.chartLabel}>{d.label}</Text>
          </View>
        );
      })}
      {unit ? <Text style={styles.chartUnit}>{unit}</Text> : null}
    </View>
  );
}

interface DualBarChartProps {
  labels: string[];
  seriesA: number[];
  seriesB: number[];
  legendA: string;
  legendB: string;
  colorA: string;
  colorB: string;
}

function DualBarChart({
  labels,
  seriesA,
  seriesB,
  legendA,
  legendB,
  colorA,
  colorB,
}: DualBarChartProps) {
  const max = Math.max(1, ...seriesA, ...seriesB);
  return (
    <View>
      <View style={styles.chartRow}>
        {labels.map((label, idx) => {
          const a = seriesA[idx] ?? 0;
          const b = seriesB[idx] ?? 0;
          return (
            <View key={`${label}-${idx}`} style={styles.chartCol}>
              <View style={styles.dualBarWrapper}>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${Math.max(4, (a / max) * 100)}%`,
                        backgroundColor: colorA,
                      },
                    ]}
                  />
                </View>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${Math.max(4, (b / max) * 100)}%`,
                        backgroundColor: colorB,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.chartLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colorA }]} />
          <Text style={styles.legendText}>{legendA}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colorB }]} />
          <Text style={styles.legendText}>{legendB}</Text>
        </View>
      </View>
    </View>
  );
}

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  testID?: string;
}

function MetricTile({ icon, label, value, hint, accent, testID }: MetricTileProps) {
  return (
    <View style={[styles.metricTile, accent ? { borderColor: accent } : null]} testID={testID}>
      <View style={[styles.metricIcon, accent ? { backgroundColor: accent + "22" } : null]}>
        {icon}
      </View>
      <Text style={styles.metricLabel} numberOfLines={2}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      {hint ? <Text style={styles.metricHint} numberOfLines={2}>{hint}</Text> : null}
    </View>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hives, queens, inspections, tasks, harvests } = useBeeMind();
  const { isPro } = usePro();
  const { t } = useLanguage();
  const proCopy = (t as unknown as { pro?: Record<string, string> }).pro ?? {};

  const now = useMemo(() => new Date(), []);
  const startOfThisMonth = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
    [now]
  );

  const totalHives = hives.length;
  const activeHives = useMemo(
    () => hives.filter((h) => h.status === "Active").length,
    [hives]
  );
  const totalHarvest = useMemo(
    () => harvests.reduce((sum, h) => sum + (h.weight_kg ?? 0), 0),
    [harvests]
  );
  const inspectionsThisMonth = useMemo(
    () =>
      inspections.filter(
        (i) => new Date(i.performed_at).getTime() >= startOfThisMonth.getTime()
      ).length,
    [inspections, startOfThisMonth]
  );
  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !task.is_done &&
          task.due_at &&
          new Date(task.due_at).getTime() < now.getTime()
      ).length,
    [tasks, now]
  );

  const lastInspectionByHive = useMemo(() => {
    const map = new Map<string, number>();
    for (const insp of inspections) {
      const ts = new Date(insp.performed_at).getTime();
      if (Number.isNaN(ts)) continue;
      const prev = map.get(insp.hive_id);
      if (!prev || ts > prev) map.set(insp.hive_id, ts);
    }
    return map;
  }, [inspections]);

  const hivesNeedingInspection = useMemo(() => {
    return hives.filter((hive) => {
      const last = lastInspectionByHive.get(hive.id);
      if (!last) return true;
      return now.getTime() - last > INSPECTION_STALE_DAYS * MS_DAY;
    }).length;
  }, [hives, lastInspectionByHive, now]);

  const averageQueenAgeDays = useMemo(() => {
    const active = queens.filter((q) => q.status === "Active" && q.hatch_date);
    if (active.length === 0) return null;
    const total = active.reduce((sum, q) => {
      const ts = new Date(q.hatch_date as string).getTime();
      if (Number.isNaN(ts)) return sum;
      return sum + (now.getTime() - ts) / MS_DAY;
    }, 0);
    return Math.round(total / active.length);
  }, [queens, now]);

  const hiveHealth = useMemo(() => {
    let healthy = 0;
    let needsInspection = 0;
    let queenIssue = 0;
    let lowActivity = 0;
    const queensByHive = new Map<string, typeof queens>();
    for (const q of queens) {
      if (!q.hive_id) continue;
      const list = queensByHive.get(q.hive_id) ?? [];
      list.push(q);
      queensByHive.set(q.hive_id, list);
    }
    const overdueByHive = new Set<string>();
    for (const task of tasks) {
      if (
        !task.is_done &&
        task.due_at &&
        task.hive_id &&
        new Date(task.due_at).getTime() < now.getTime()
      ) {
        overdueByHive.add(task.hive_id);
      }
    }
    for (const hive of hives) {
      const last = lastInspectionByHive.get(hive.id);
      const stale = !last || now.getTime() - last > INSPECTION_STALE_DAYS * MS_DAY;
      const veryStale = !last || now.getTime() - last > 60 * MS_DAY;
      const hQueens = queensByHive.get(hive.id) ?? [];
      const activeQueen = hQueens.find((q) => q.status === "Active");
      const queenAgeDays = activeQueen?.hatch_date
        ? (now.getTime() - new Date(activeQueen.hatch_date).getTime()) / MS_DAY
        : null;
      const hasQueenIssue =
        !activeQueen || (queenAgeDays !== null && queenAgeDays > QUEEN_AGE_WARN_DAYS);

      if (hasQueenIssue) {
        queenIssue += 1;
      } else if (veryStale) {
        lowActivity += 1;
      } else if (stale) {
        needsInspection += 1;
      } else if (overdueByHive.has(hive.id)) {
        needsInspection += 1;
      } else {
        healthy += 1;
      }
    }
    return { healthy, needsInspection, queenIssue, lowActivity };
  }, [hives, queens, tasks, lastInspectionByHive, now]);

  const harvestSeries = useMemo(
    () =>
      sumByMonth(
        harvests.map((h) => ({ date: h.created_at, amount: h.weight_kg ?? 0 })),
        6
      ),
    [harvests]
  );
  const inspectionSeries = useMemo(
    () => bucketByMonth(inspections.map((i) => ({ date: i.performed_at })), 6),
    [inspections]
  );

  const tasksLabels = useMemo(() => lastNMonths(6).map((m) => m.label), []);
  const completedTaskSeries = useMemo(() => {
    const completed = tasks
      .filter((task) => task.is_done && task.completed_at)
      .map((task) => ({ date: task.completed_at as string }));
    return bucketByMonth(completed, 6).map((b) => b.value);
  }, [tasks]);
  const overdueTaskSeries = useMemo(() => {
    const months = lastNMonths(6);
    return months.map((m) => {
      const next = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 1);
      return tasks.filter((task) => {
        if (task.is_done) return false;
        if (!task.due_at) return false;
        const due = new Date(task.due_at).getTime();
        return due >= m.date.getTime() && due < next.getTime() && due < now.getTime();
      }).length;
    });
  }, [tasks, now]);

  const totalHivesScored = Math.max(1, totalHives);
  const healthPct = Math.round((hiveHealth.healthy / totalHivesScored) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="insights-scroll"
    >
      <LinearGradient
        colors={[
          Colors.light.secondary + "55",
          Colors.light.primary + "33",
          Colors.light.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: 32 + insets.top }]}
      >
        <View style={styles.heroBadge}>
          <Sparkles size={14} color={Colors.light.text} />
          <Text style={styles.heroBadgeText}>Apiary Insights</Text>
        </View>
        <Text style={styles.heroTitle}>Apiary Health Overview</Text>
        <Text style={styles.heroSubtitle}>
          {totalHives === 0
            ? "Add your first hive to unlock insights."
            : `${hiveHealth.healthy} of ${totalHives} colonies trending healthy.`}
        </Text>
        <View style={styles.healthMeter}>
          <View style={[styles.healthMeterFill, { width: `${healthPct}%` }]} />
        </View>
        <Text style={styles.healthMeterCaption}>
          {healthPct}% healthy · {hiveHealth.needsInspection} need inspection · {hiveHealth.queenIssue} queen issues
        </Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <Text style={styles.sectionHint}>Real-time numbers across your apiary</Text>
        <View style={styles.metricsGrid}>
          <MetricTile
            icon={<Hexagon size={18} color={Colors.light.primary} />}
            label="Total hives"
            value={`${totalHives}`}
            hint={`${activeHives} active`}
            accent={Colors.light.primary}
            testID="metric-total-hives"
          />
          <MetricTile
            icon={<Droplet size={18} color={Colors.light.secondary} />}
            label="Total harvest"
            value={`${totalHarvest.toFixed(1)} kg`}
            hint={`${harvests.length} batches`}
            accent={Colors.light.secondary}
            testID="metric-total-harvest"
          />
          <MetricTile
            icon={<Activity size={18} color={Colors.light.success} />}
            label="Inspections this month"
            value={`${inspectionsThisMonth}`}
            hint={`${inspections.length} all-time`}
            accent={Colors.light.success}
            testID="metric-inspections-month"
          />
          <MetricTile
            icon={<CalendarClock size={18} color={Colors.light.error} />}
            label="Overdue tasks"
            value={`${overdueTasks}`}
            hint={overdueTasks > 0 ? "Catch up this week" : "All caught up"}
            accent={Colors.light.error}
            testID="metric-overdue"
          />
          <MetricTile
            icon={<AlertTriangle size={18} color={Colors.light.warning} />}
            label="Hives needing inspection"
            value={`${hivesNeedingInspection}`}
            hint={`>${INSPECTION_STALE_DAYS} days since last`}
            accent={Colors.light.warning}
            testID="metric-needs-inspection"
          />
          <MetricTile
            icon={<Crown size={18} color={Colors.light.primary} />}
            label="Avg queen age"
            value={
              averageQueenAgeDays === null
                ? "—"
                : `${averageQueenAgeDays}d`
            }
            hint={
              averageQueenAgeDays === null
                ? "Add active queens"
                : averageQueenAgeDays > QUEEN_AGE_WARN_DAYS
                ? "Consider requeening"
                : "Within healthy range"
            }
            accent={Colors.light.primary}
            testID="metric-queen-age"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Hive Health</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/hives")}
            style={styles.sectionAction}
            testID="insights-hives-link"
          >
            <Text style={styles.sectionActionText}>View hives</Text>
          </Pressable>
        </View>
        <View style={styles.healthCard}>
          <HealthRow
            color={Colors.light.success}
            icon={<CheckCircle2 size={16} color={Colors.light.success} />}
            label="Healthy"
            count={hiveHealth.healthy}
            total={totalHivesScored}
          />
          <HealthRow
            color={Colors.light.warning}
            icon={<Activity size={16} color={Colors.light.warning} />}
            label="Needs inspection"
            count={hiveHealth.needsInspection}
            total={totalHivesScored}
          />
          <HealthRow
            color={Colors.light.error}
            icon={<Crown size={16} color={Colors.light.error} />}
            label="Queen issue"
            count={hiveHealth.queenIssue}
            total={totalHivesScored}
          />
          <HealthRow
            color={Colors.light.tabIconDefault}
            icon={<AlertTriangle size={16} color={Colors.light.tabIconDefault} />}
            label="Low activity"
            count={hiveHealth.lowActivity}
            total={totalHivesScored}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Harvest Over Time</Text>
        <Text style={styles.sectionHint}>Last 6 months · kilograms collected</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={harvestSeries}
            color={Colors.light.primary}
            unit="kg"
            testID="chart-harvest"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspections per Month</Text>
        <Text style={styles.sectionHint}>Cadence over the last 6 months</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={inspectionSeries}
            color={Colors.light.secondary}
            testID="chart-inspections"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Tasks: Completed vs Overdue</Text>
            {!isPro ? (
              <View style={styles.proBadge}>
                <Crown size={11} color="#FFFFFF" />
                <Text style={styles.proBadgeText}>{proCopy.badge ?? "Pro"}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.sectionHint}>Compare completion vs slipping</Text>
        <View style={styles.chartCard}>
          {isPro ? (
            <DualBarChart
              labels={tasksLabels}
              seriesA={completedTaskSeries}
              seriesB={overdueTaskSeries}
              legendA="Completed"
              legendB="Overdue"
              colorA={Colors.light.success}
              colorB={Colors.light.error}
            />
          ) : (
            <View style={styles.lockedChart} testID="chart-tasks-locked">
              <View style={styles.lockBadge}>
                <Lock size={18} color={Colors.light.text} />
              </View>
              <Text style={styles.lockedTitle}>Advanced task analytics</Text>
              <Text style={styles.lockedHint}>
                {proCopy.advancedStatsLocked ?? "Upgrade to BeeMind Pro to unlock advanced charts."}
              </Text>
              <Pressable
                style={styles.lockedCta}
                onPress={() => router.push("/(tabs)/settings")}
                testID="insights-upgrade-cta"
              >
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.lockedCtaText}>{proCopy.upgradeButton ?? "Upgrade to Pro"}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.section, styles.sectionLast]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.sectionHint}>Last 5 events across the apiary</Text>
        <RecentActivity
          inspections={inspections}
          harvests={harvests}
          tasks={tasks}
        />
      </View>
    </ScrollView>
  );
}

interface HealthRowProps {
  color: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
}

function HealthRow({ color, icon, label, count, total }: HealthRowProps) {
  const pct = Math.round((count / Math.max(1, total)) * 100);
  return (
    <View style={styles.healthRow}>
      <View style={styles.healthRowHeader}>
        <View style={styles.healthRowLabel}>
          {icon}
          <Text style={styles.healthRowText}>{label}</Text>
        </View>
        <Text style={styles.healthRowCount}>{count}</Text>
      </View>
      <View style={styles.healthBarTrack}>
        <View
          style={[
            styles.healthBarFill,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

interface RecentActivityProps {
  inspections: { id: string; performed_at: string; hive_id: string }[];
  harvests: { id: string; created_at: string; weight_kg: number }[];
  tasks: { id: string; title: string; created_at: string; is_done: boolean }[];
}

function RecentActivity({ inspections, harvests, tasks }: RecentActivityProps) {
  const events = useMemo(() => {
    const items: { id: string; ts: number; title: string; subtitle: string; icon: React.ReactNode }[] = [];
    for (const i of inspections) {
      const ts = new Date(i.performed_at).getTime();
      if (Number.isNaN(ts)) continue;
      items.push({
        id: `i-${i.id}`,
        ts,
        title: "Inspection logged",
        subtitle: new Date(ts).toLocaleDateString(),
        icon: <Activity size={16} color={Colors.light.secondary} />,
      });
    }
    for (const h of harvests) {
      const ts = new Date(h.created_at).getTime();
      if (Number.isNaN(ts)) continue;
      items.push({
        id: `h-${h.id}`,
        ts,
        title: `Harvest · ${h.weight_kg.toFixed(1)} kg`,
        subtitle: new Date(ts).toLocaleDateString(),
        icon: <Droplet size={16} color={Colors.light.primary} />,
      });
    }
    for (const task of tasks) {
      const ts = new Date(task.created_at).getTime();
      if (Number.isNaN(ts)) continue;
      items.push({
        id: `t-${task.id}`,
        ts,
        title: task.is_done ? `Completed · ${task.title}` : `Task · ${task.title}`,
        subtitle: new Date(ts).toLocaleDateString(),
        icon: task.is_done ? (
          <CheckCircle2 size={16} color={Colors.light.success} />
        ) : (
          <CalendarClock size={16} color={Colors.light.warning} />
        ),
      });
    }
    return items.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [inspections, harvests, tasks]);

  if (events.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No activity yet. Log an inspection to get started.</Text>
      </View>
    );
  }

  return (
    <View style={styles.activityCard}>
      {events.map((event, idx) => (
        <View
          key={event.id}
          style={[
            styles.activityRow,
            idx === events.length - 1 ? styles.activityRowLast : null,
          ]}
        >
          <View style={styles.activityIcon}>{event.icon}</View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle} numberOfLines={1}>{event.title}</Text>
            <Text style={styles.activitySubtitle}>{event.subtitle}</Text>
          </View>
        </View>
      ))}
    </View>
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
    paddingBottom: 28,
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: Colors.light.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.text,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  healthMeter: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  healthMeterFill: {
    height: "100%",
    backgroundColor: Colors.light.success,
  },
  healthMeterCaption: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
  },
  sectionLast: {
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
  },
  sectionAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricTile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  metricHint: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  healthCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 14,
  },
  healthRow: {
    gap: 6,
  },
  healthRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthRowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthRowText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  healthRowCount: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  healthBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.background,
    overflow: "hidden",
  },
  healthBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 160,
    gap: 6,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    gap: 4,
  },
  chartBarTrack: {
    width: "100%",
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    fontWeight: "500" as const,
  },
  chartValue: {
    fontSize: 10,
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  chartUnit: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    fontSize: 11,
    color: Colors.light.tabIconDefault,
  },
  dualBarWrapper: {
    flexDirection: "row",
    flex: 1,
    width: "100%",
    gap: 3,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  proBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  lockedChart: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  lockedHint: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    textAlign: "center" as const,
    paddingHorizontal: 16,
  },
  lockedCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  lockedCtaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  activityCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  activityRowLast: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  activitySubtitle: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  emptyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    textAlign: "center" as const,
  },
});
