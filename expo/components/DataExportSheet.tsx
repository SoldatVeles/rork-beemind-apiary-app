import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Archive,
  ClipboardList,
  Download,
  Droplet,
  ListChecks,
  Package,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import { usePro } from "@/store/pro-store";
import { useLanguage } from "@/store/language-store";
import { shareCsv, toCsv, type CsvRow } from "@/lib/csv-export";

type DatasetKey =
  | "hives"
  | "inspections"
  | "tasks"
  | "harvests"
  | "inventory";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLockedTap?: () => void;
}

/**
 * CSV data export sheet (Pro feature). Lets the user pick a dataset and
 * download or share it as a CSV file.
 */
export default function DataExportSheet({ visible, onClose, onLockedTap }: Props) {
  const { isPro } = usePro();
  const { t } = useLanguage();
  const proCopy = (t as unknown as { pro?: Record<string, string> }).pro ?? {};
  const { hives, yards, inspections, tasks, harvests, inventory } = useBeeMind();
  const [busy, setBusy] = useState<DatasetKey | null>(null);

  const yardNameById = useMemo(() => {
    const map: Record<string, string> = {};
    yards.forEach((y) => {
      map[y.id] = y.name;
    });
    return map;
  }, [yards]);

  const hiveLabelById = useMemo(() => {
    const map: Record<string, string> = {};
    hives.forEach((h) => {
      map[h.id] = h.label;
    });
    return map;
  }, [hives]);

  const datasets: Array<{
    key: DatasetKey;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
    count: number;
    build: () => { rows: CsvRow[]; headers: string[] };
  }> = [
    {
      key: "hives",
      title: "Hives",
      subtitle: "Label, yard, status, frames",
      icon: Archive,
      count: hives.length,
      build: () => ({
        headers: ["label", "yard", "hive_type", "frames", "status", "notes", "created_at"],
        rows: hives.map((h) => ({
          label: h.label,
          yard: yardNameById[h.yard_id] ?? h.yard_id,
          hive_type: h.hive_type,
          frames: h.frames,
          status: h.status,
          notes: h.notes ?? "",
          created_at: h.created_at,
        })),
      }),
    },
    {
      key: "inspections",
      title: "Inspections",
      subtitle: "Date, hive, brood, mites, notes",
      icon: ClipboardList,
      count: inspections.length,
      build: () => ({
        headers: [
          "performed_at",
          "hive",
          "brood_pattern",
          "population_strength",
          "honey_stores",
          "stores_kg",
          "mites_per_100",
          "queen_seen",
          "eggs_seen",
          "larvae_seen",
          "notes",
        ],
        rows: inspections.map((i) => ({
          performed_at: i.performed_at,
          hive: hiveLabelById[i.hive_id] ?? i.hive_id,
          brood_pattern: i.brood_pattern ?? "",
          population_strength: i.population_strength ?? "",
          honey_stores: i.honey_stores ?? "",
          stores_kg: i.stores_kg ?? "",
          mites_per_100: i.mites_per_100 ?? "",
          queen_seen: i.queen_seen ?? "",
          eggs_seen: i.eggs_seen ?? "",
          larvae_seen: i.larvae_seen ?? "",
          notes: i.notes ?? "",
        })),
      }),
    },
    {
      key: "tasks",
      title: "Tasks",
      subtitle: "Title, scope, due date, status",
      icon: ListChecks,
      count: tasks.length,
      build: () => ({
        headers: [
          "title",
          "scope",
          "yard",
          "hive",
          "priority",
          "due_at",
          "is_done",
          "completed_at",
          "created_at",
        ],
        rows: tasks.map((tk) => ({
          title: tk.title,
          scope: tk.scope,
          yard: tk.yard_id ? yardNameById[tk.yard_id] ?? tk.yard_id : "",
          hive: tk.hive_id ? hiveLabelById[tk.hive_id] ?? tk.hive_id : "",
          priority: tk.priority,
          due_at: tk.due_at ?? "",
          is_done: tk.is_done,
          completed_at: tk.completed_at ?? "",
          created_at: tk.created_at,
        })),
      }),
    },
    {
      key: "harvests",
      title: "Harvests",
      subtitle: "Frames, weight, moisture",
      icon: Droplet,
      count: harvests.length,
      build: () => ({
        headers: [
          "created_at",
          "yard",
          "hive",
          "frames_spun",
          "weight_kg",
          "moisture_pct",
          "lot_code",
        ],
        rows: harvests.map((h) => ({
          created_at: h.created_at,
          yard: h.yard_id ? yardNameById[h.yard_id] ?? h.yard_id : "",
          hive: h.hive_id ? hiveLabelById[h.hive_id] ?? h.hive_id : "",
          frames_spun: h.frames_spun,
          weight_kg: h.weight_kg,
          moisture_pct: h.moisture_pct ?? "",
          lot_code: h.lot_code ?? "",
        })),
      }),
    },
    {
      key: "inventory",
      title: "Inventory",
      subtitle: "Item, category, quantity",
      icon: Package,
      count: inventory.length,
      build: () => ({
        headers: ["name", "category", "quantity", "unit", "min_quantity", "created_at"],
        rows: inventory.map((it) => ({
          name: it.name,
          category: it.category,
          quantity: it.quantity,
          unit: it.unit,
          min_quantity: it.min_quantity ?? "",
          created_at: it.created_at,
        })),
      }),
    },
  ];

  const handleExport = async (ds: typeof datasets[number]) => {
    if (!isPro) {
      console.log("[DataExportSheet] export tap blocked, user is free");
      onClose();
      onLockedTap?.();
      return;
    }
    if (ds.count === 0) {
      Alert.alert(`No ${ds.title.toLowerCase()} yet`, `Add some ${ds.title.toLowerCase()} before exporting.`);
      return;
    }
    try {
      setBusy(ds.key);
      const { rows, headers } = ds.build();
      const csv = toCsv(rows, headers);
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `beemind_${ds.key}_${stamp}.csv`;
      console.log(`[DataExportSheet] exporting ${ds.key} (${rows.length} rows)`);
      await shareCsv(filename, csv);
    } catch (error) {
      console.error("[DataExportSheet] export failed", error);
      Alert.alert("Export failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet} testID="data-export-sheet">
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} testID="data-export-close">
            <X size={20} color={Colors.light.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Download size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Export your data</Text>
            <Text style={styles.subtitle}>
              {isPro
                ? "Pick a dataset to download as CSV."
                : (proCopy.reportExportLocked ?? "Exporting data is a Pro feature.")}
            </Text>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {datasets.map((ds) => {
              const Icon = ds.icon;
              const isBusy = busy === ds.key;
              return (
                <TouchableOpacity
                  key={ds.key}
                  style={styles.row}
                  onPress={() => handleExport(ds)}
                  disabled={isBusy}
                  testID={`data-export-${ds.key}`}
                >
                  <View style={styles.rowIcon}>
                    <Icon size={20} color={Colors.light.primary} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{ds.title}</Text>
                    <Text style={styles.rowSubtitle}>
                      {ds.count} {ds.count === 1 ? "row" : "rows"} · {ds.subtitle}
                    </Text>
                  </View>
                  {isBusy ? (
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                  ) : (
                    <Download size={18} color={isPro ? Colors.light.primary : Colors.light.tabIconDefault} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.select({ ios: 32, default: 20 }),
    maxHeight: "85%",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 12,
    alignItems: "center",
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.background,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
});
