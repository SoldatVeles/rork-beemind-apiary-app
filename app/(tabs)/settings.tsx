import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from "react-native";
import { Database, Download, Trash2, Info, ChevronRight, Activity, FileText, Languages } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useBeeMindStore } from "@/store/beemind-store";
import { useLanguage } from "@/store/language-store";
import type { Language } from "@/constants/translations";

export default function SettingsScreen() {
  const router = useRouter();
  const { yards, hives, inspections, tasks, loadSeedData } = useBeeMindStore();
  const { language, setLanguage, t } = useLanguage();

  const handleLoadSeedData = () => {
    Alert.alert(
      t.settings.loadDemoConfirm,
      t.settings.loadDemoMessage,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: "Load",
          style: "destructive",
          onPress: () => {
            loadSeedData();
            Alert.alert(t.common.success, t.settings.loadDemoSuccess);
          },
        },
      ]
    );
  };

  const handleExport = () => {
    const exportData = {
      yards,
      hives,
      inspections,
      tasks,
      queens: useBeeMindStore.getState().queens,
      harvests: useBeeMindStore.getState().harvests,
      devices: useBeeMindStore.getState().devices,
      sensorReadings: useBeeMindStore.getState().sensorReadings,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    Alert.alert(
      t.settings.exportTitle,
      `${t.settings.exportMessage} ${yards.length} ${t.settings.yards.toLowerCase()}, ${hives.length} ${t.settings.hives.toLowerCase()}, ${inspections.length} ${t.settings.inspections.toLowerCase()}, ${tasks.length} ${t.settings.tasks.toLowerCase()}.\n\nData size: ${(jsonString.length / 1024).toFixed(2)} KB`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.settings.exportCopy,
          onPress: () => {
            Alert.alert(t.common.success, t.settings.exportNote);
            console.log("Export data:", jsonString);
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      t.settings.clearConfirm,
      t.settings.clearMessage,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.settings.clearButton,
          style: "destructive",
          onPress: () => {
            const store = useBeeMindStore.getState();
            
            store.yards.forEach((y) => store.deleteYard(y.id));
            store.hives.forEach((h) => store.deleteHive(h.id));
            store.queens.forEach((q) => store.deleteQueen(q.id));
            store.inspections.forEach((i) => store.deleteInspection(i.id));
            store.tasks.forEach((task) => store.deleteTask(task.id));
            store.harvests.forEach((h) => store.deleteHarvest(h.id));
            store.devices.forEach((d) => store.deleteDevice(d.id));
            
            Alert.alert(t.common.success, t.settings.clearSuccess);
          },
        },
      ]
    );
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const getLanguageName = (lang: Language) => {
    switch (lang) {
      case "en":
        return t.settings.english;
      case "es":
        return t.settings.spanish;
      case "pt":
        return t.settings.portuguese;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.language}</Text>
        <View style={styles.languageContainer}>
          {(["en", "es", "pt"] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageButton,
                language === lang && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageChange(lang)}
            >
              <Languages
                size={20}
                color={language === lang ? "#FFFFFF" : Colors.light.primary}
              />
              <Text
                style={[
                  styles.languageButtonText,
                  language === lang && styles.languageButtonTextActive,
                ]}
              >
                {getLanguageName(lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.dataOverview}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{yards.length}</Text>
            <Text style={styles.statLabel}>{t.settings.yards}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hives.length}</Text>
            <Text style={styles.statLabel}>{t.settings.hives}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{inspections.length}</Text>
            <Text style={styles.statLabel}>{t.settings.inspections}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tasks.length}</Text>
            <Text style={styles.statLabel}>{t.settings.tasks}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.management}</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/reports" as any)}>
          <View style={styles.menuIcon}>
            <FileText size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.menuText}>{t.settings.reportsAnalytics}</Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/devices" as any)}>
          <View style={styles.menuIcon}>
            <Activity size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.menuText}>{t.settings.devicesSensors}</Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.dataManagement}</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleLoadSeedData}>
          <View style={styles.menuIcon}>
            <Database size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.menuText}>{t.settings.loadDemoData}</Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleExport}>
          <View style={styles.menuIcon}>
            <Download size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.menuText}>{t.settings.exportData}</Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
          <View style={styles.menuIcon}>
            <Trash2 size={20} color={Colors.light.error} />
          </View>
          <Text style={[styles.menuText, { color: Colors.light.error }]}>{t.settings.clearAllData}</Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.about}</Text>
        <View style={styles.infoCard}>
          <Info size={24} color={Colors.light.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>BeeMind</Text>
            <Text style={styles.infoText}>
              {t.settings.aboutText}
            </Text>
            <Text style={styles.infoVersion}>{t.settings.version}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.supabaseIntegration}</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {t.settings.supabaseText}
          </Text>
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
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.card,
    padding: 20,
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
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  menuItem: {
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
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    gap: 16,
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
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  infoVersion: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    fontWeight: "500" as const,
  },
  languageContainer: {
    gap: 8,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
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
  languageButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  languageButtonTextActive: {
    color: "#FFFFFF",
  },
});
