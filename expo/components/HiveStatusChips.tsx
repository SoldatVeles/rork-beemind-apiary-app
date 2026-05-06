import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "../constants/colors";
import type { Hive, Inspection, Queen, Task } from "../types";

interface Props {
  hive: Hive;
  inspections: Inspection[];
  queens: Queen[];
  tasks: Task[];
}

interface ChipDef {
  key: string;
  label: string;
  tone: "success" | "warning" | "error" | "info";
}

const TONE_COLORS = {
  success: { bg: Colors.light.success + "22", fg: Colors.light.success },
  warning: { bg: Colors.light.warning + "26", fg: "#A16207" },
  error: { bg: Colors.light.error + "22", fg: Colors.light.error },
  info: { bg: Colors.light.secondary + "22", fg: Colors.light.secondary },
} as const;

const INSPECTION_INTERVAL_DAYS = 14;

/**
 * Returns simple, beginner-friendly status chips for a hive based on its
 * inspections, queen, and pending tasks. No complex scoring – just clear flags.
 */
export function getHiveStatusChips({ hive, inspections, queens, tasks }: Props): ChipDef[] {
  const chips: ChipDef[] = [];
  const now = Date.now();

  if (hive.status === "Deadout") {
    chips.push({ key: "deadout", label: "Deadout", tone: "error" });
    return chips;
  }
  if (hive.status === "Split") {
    chips.push({ key: "split", label: "Split", tone: "info" });
  }

  const hiveInspections = inspections.filter((i) => i.hive_id === hive.id);
  const latest = [...hiveInspections].sort(
    (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
  )[0];

  const overdueTasks = tasks.filter(
    (t) => t.hive_id === hive.id && !t.is_done && t.due_at && new Date(t.due_at).getTime() < now
  );
  if (overdueTasks.length > 0) {
    chips.push({
      key: "overdue-task",
      label: overdueTasks.length === 1 ? "Overdue task" : `${overdueTasks.length} overdue tasks`,
      tone: "error",
    });
  }

  if (!latest) {
    chips.push({ key: "needs-inspection", label: "Needs inspection", tone: "warning" });
  } else {
    const daysSince = Math.floor((now - new Date(latest.performed_at).getTime()) / 86400000);
    if (daysSince > INSPECTION_INTERVAL_DAYS) {
      chips.push({ key: "needs-inspection", label: "Needs inspection", tone: "warning" });
    }
    if (latest.honey_stores === "low") {
      chips.push({ key: "low-stores", label: "Low stores", tone: "warning" });
    }
    if (latest.queen_seen === false && latest.eggs_seen === false) {
      chips.push({ key: "queen-issue", label: "Queen issue", tone: "error" });
    }
  }

  const activeQueen = queens.find((q) => q.hive_id === hive.id && q.status === "Active");
  if (!activeQueen && hive.status === "Active") {
    chips.push({ key: "no-queen", label: "Queen issue", tone: "error" });
  }

  if (chips.length === 0 && hive.status === "Active") {
    chips.push({ key: "healthy", label: "Healthy", tone: "success" });
  }

  // Deduplicate by label
  const seen = new Set<string>();
  return chips.filter((c) => (seen.has(c.label) ? false : (seen.add(c.label), true)));
}

export default function HiveStatusChips(props: Props) {
  const chips = useMemo(() => getHiveStatusChips(props), [props]);
  if (chips.length === 0) return null;
  return (
    <View style={styles.row}>
      {chips.map((c) => {
        const tone = TONE_COLORS[c.tone];
        return (
          <View key={c.key} style={[styles.chip, { backgroundColor: tone.bg }]}>
            <Text style={[styles.chipText, { color: tone.fg }]}>{c.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});
