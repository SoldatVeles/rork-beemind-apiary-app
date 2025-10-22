import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import { AlertCircle, CheckCircle, Clock } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useBeeMindStore } from "@/store/beemind-store";
import { useLanguage } from "@/store/language-store";

export default function HomeScreen() {
  const router = useRouter();
  const { tasks, inspections, hives, loadSeedData } = useBeeMindStore();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    if (hives.length === 0) {
      loadSeedData();
    }
  }, [hives.length, loadSeedData]);

  const dueTasks = tasks
    .filter((task) => !task.is_done && task.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 5);

  const recentInspections = inspections
    .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
    .slice(0, 3);

  const activeHives = hives.filter((h) => h.status === "Active").length;
  const completedTasks = tasks.filter((task) => task.is_done).length;
  const pendingTasks = tasks.filter((task) => !task.is_done).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t.home.today;
    if (diffDays === 1) return t.home.tomorrow;
    if (diffDays === -1) return t.home.yesterday;
    if (diffDays < 0) return `${Math.abs(diffDays)} ${t.home.daysAgo}`;
    return `${t.home.inDays} ${diffDays} days`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.bannerContainer}>
          <View style={styles.languageFlags}>
            <TouchableOpacity
              style={[
                styles.flagButton,
                language === "en" && styles.flagButtonActive,
              ]}
              onPress={() => setLanguage("en")}
            >
              <Text style={styles.flagEmoji}>🇬🇧</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.flagButton,
                language === "es" && styles.flagButtonActive,
              ]}
              onPress={() => setLanguage("es")}
            >
              <Text style={styles.flagEmoji}>🇪🇸</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.flagButton,
                language === "pt" && styles.flagButtonActive,
              ]}
              onPress={() => setLanguage("pt")}
            >
              <Text style={styles.flagEmoji}>🇵🇹</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>{t.home.subtitle}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeHives}</Text>
          <Text style={styles.statLabel}>{t.home.activeHives}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingTasks}</Text>
          <Text style={styles.statLabel}>{t.home.pendingTasks}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedTasks}</Text>
          <Text style={styles.statLabel}>{t.home.completed}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.home.upcomingTasks}</Text>
          <TouchableOpacity onPress={() => router.push("/tasks")}>
            <Text style={styles.seeAll}>{t.common.seeAll}</Text>
          </TouchableOpacity>
        </View>
        {dueTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color={Colors.light.success} />
            <Text style={styles.emptyText}>{t.home.noPendingTasks}</Text>
          </View>
        ) : (
          dueTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => router.push("/tasks")}
            >
              <View style={styles.taskIcon}>
                <Clock size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDue}>{formatDate(task.due_at!)}</Text>
              </View>
              <View
                style={[
                  styles.priorityBadge,
                  task.priority === 1 && styles.priorityHigh,
                  task.priority === 2 && styles.priorityMedium,
                  task.priority === 3 && styles.priorityLow,
                ]}
              >
                <Text style={styles.priorityText}>
                  {task.priority === 1 ? t.tasks.high : task.priority === 2 ? t.tasks.medium : t.tasks.low}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.home.recentInspections}</Text>
          <TouchableOpacity onPress={() => router.push("/hives")}>
            <Text style={styles.seeAll}>{t.common.seeAll}</Text>
          </TouchableOpacity>
        </View>
        {recentInspections.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyText}>{t.home.noInspections}</Text>
          </View>
        ) : (
          recentInspections.map((inspection) => {
            const hive = hives.find((h) => h.id === inspection.hive_id);
            return (
              <View key={inspection.id} style={styles.inspectionCard}>
                <View style={styles.inspectionHeader}>
                  <Text style={styles.inspectionHive}>{hive?.label || "Unknown Hive"}</Text>
                  <Text style={styles.inspectionDate}>
                    {formatDate(inspection.performed_at)}
                  </Text>
                </View>
                <View style={styles.inspectionDetails}>
                  {inspection.brood_pattern && (
                    <View style={styles.inspectionBadge}>
                      <Text style={styles.inspectionBadgeText}>
                        {t.home.brood}: {inspection.brood_pattern}
                      </Text>
                    </View>
                  )}
                  {inspection.mites_per_100 !== undefined && (
                    <View
                      style={[
                        styles.inspectionBadge,
                        inspection.mites_per_100 > 3 && styles.inspectionBadgeWarning,
                      ]}
                    >
                      <Text style={styles.inspectionBadgeText}>
                        {t.home.mites}: {inspection.mites_per_100}%
                      </Text>
                    </View>
                  )}
                  {inspection.temper !== undefined && (
                    <View style={styles.inspectionBadge}>
                      <Text style={styles.inspectionBadgeText}>
                        {t.home.temper}: {inspection.temper}/5
                      </Text>
                    </View>
                  )}
                </View>
                {inspection.notes && (
                  <Text style={styles.inspectionNotes} numberOfLines={2}>
                    {inspection.notes}
                  </Text>
                )}
              </View>
            );
          })
        )}
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  bannerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: Colors.light.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  languageFlags: {
    flexDirection: "row",
    gap: 6,
  },
  flagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.background,
  },
  flagButtonActive: {
    backgroundColor: Colors.light.primary + "15",
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  flagEmoji: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500" as const,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  taskDue: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityHigh: {
    backgroundColor: Colors.light.error + "20",
  },
  priorityMedium: {
    backgroundColor: Colors.light.warning + "20",
  },
  priorityLow: {
    backgroundColor: Colors.light.success + "20",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  inspectionCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inspectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inspectionHive: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  inspectionDate: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  inspectionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  inspectionBadge: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inspectionBadgeWarning: {
    backgroundColor: Colors.light.warning + "20",
  },
  inspectionBadgeText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  inspectionNotes: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 12,
  },
});
