import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from "react-native";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Database, Download, Trash2, Info, ChevronRight, Activity, FileText, Sprout, TrendingUp, Award, LogOut } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import { useLanguage } from "@/store/language-store";
import type { Language } from "@/constants/translations";
import { useUserPreferences, type ExperienceLevel } from "@/store/user-preferences-store";
import { useAuth } from "@/store/auth-store";

const languageMeta: Record<Language, { flag: string }> = {
  en: { flag: "🇬🇧" },
  es: { flag: "🇪🇸" },
  pt: { flag: "🇵🇹" },
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { yards, hives, inspections, tasks, queens, harvests, devices, deleteYard, deleteHive, deleteQueen, deleteInspection, deleteTask, deleteHarvest, deleteDevice } = useBeeMind();
  const { language, setLanguage, t } = useLanguage();
  const { experienceLevel, setExperienceLevel } = useUserPreferences();
  const { signOut, user } = useAuth();
  const currentExperienceLevel: ExperienceLevel = experienceLevel ?? "beginner";

  useEffect(() => {
    console.log("[Settings] Component rendered with experienceLevel:", currentExperienceLevel);
  }, [currentExperienceLevel]);

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
      queens: [],
      harvests: [],
      devices: [],
      sensorReadings: [],
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
          onPress: async () => {
            try {
              await Promise.all([
                ...tasks.map((task) => deleteTask(task.id)),
                ...inspections.map((i) => deleteInspection(i.id)),
                ...queens.map((q) => deleteQueen(q.id)),
                ...harvests.map((h) => deleteHarvest(h.id)),
                ...devices.map((d) => deleteDevice(d.id)),
                ...hives.map((h) => deleteHive(h.id)),
                ...yards.map((y) => deleteYard(y.id)),
              ]);
              Alert.alert(t.common.success, t.settings.clearSuccess);
            } catch (error) {
              console.error("[Settings] clear data failed", error);
              Alert.alert(t.common.error, "Failed to clear data");
            }
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

  const applyExperienceLevelChange = (level: ExperienceLevel) => {
    try {
      console.log("[Settings] Applying experience level:", level);
      setExperienceLevel(level);
      console.log("[Settings] Updated experience level:", useUserPreferences.getState().experienceLevel);
      Alert.alert(
        t.common.success || "Success",
        t.settings.levelChanged || "Experience level updated successfully!"
      );
    } catch (error) {
      console.error("[Settings] Failed to change experience level", error);
      Alert.alert(
        t.common.error || "Error",
        "Unable to update experience level. Please try again."
      );
    }
  };

  const handleExperienceLevelChange = (level: ExperienceLevel) => {
    if (currentExperienceLevel === level) {
      console.log("[Settings] Selected level is already active. Skipping change.");
      return;
    }

    console.log("[Settings] Attempting to change to level:", level);

    if (Platform.OS === "web") {
      applyExperienceLevelChange(level);
      return;
    }

    Alert.alert(
      t.settings.changeLevelTitle || "Change Experience Level?",
      t.settings.changeLevelMessage || `Switching to ${level} will adjust available features. Continue?`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.confirm || "Confirm",
          onPress: () => applyExperienceLevelChange(level),
        },
      ]
    );
  };

  const getLevelInfo = (level: ExperienceLevel) => {
    switch (level) {
      case "beginner":
        return {
          icon: Sprout,
          title: t.onboarding?.beginner || "Beginner",
          description: t.onboarding?.beginnerDesc || "Just starting your beekeeping journey",
          color: "#10B981",
        };
      case "intermediate":
        return {
          icon: TrendingUp,
          title: t.onboarding?.intermediate || "Intermediate",
          description: t.onboarding?.intermediateDesc || "Managing a growing apiary",
          color: "#F59E0B",
        };
      case "advanced":
        return {
          icon: Award,
          title: t.onboarding?.advanced || "Advanced",
          description: t.onboarding?.advancedDesc || "Professional beekeeper",
          color: "#8B5CF6",
        };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: 16 + insets.top }]}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.experienceLevel || "Experience Level"}</Text>
        <Text style={styles.sectionDescription}>
          {t.settings.experienceLevelDesc || "Your experience level controls which features are available and what tips you see."}
        </Text>
        <View style={styles.levelContainer}>
          {(["beginner", "intermediate", "advanced"] as const).map((level) => {
            const info = getLevelInfo(level);
            const Icon = info.icon;
            const isActive = currentExperienceLevel === level;

            return (
              <TouchableOpacity
                key={level}
                testID={`experience-level-${level}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.levelButton,
                  isActive && styles.levelButtonActive,
                  { borderColor: isActive ? info.color : Colors.light.border },
                ]}
                onPress={() => handleExperienceLevelChange(level)}
              >
                <View
                  style={[
                    styles.levelIconContainer,
                    { backgroundColor: info.color + "20" },
                  ]}
                >
                  <Icon size={24} color={info.color} />
                </View>
                <View style={styles.levelTextContainer}>
                  <Text
                    style={[
                      styles.levelButtonTitle,
                      isActive && { color: info.color },
                    ]}
                  >
                    {info.title}
                  </Text>
                  <Text style={styles.levelButtonDescription}>
                    {info.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
              <View
                style={[
                  styles.flagBadge,
                  language === lang && styles.flagBadgeActive,
                ]}
              >
                <Text style={styles.flagEmoji}>{languageMeta[lang].flag}</Text>
              </View>
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
        <Text style={styles.sectionTitle}>{t.settings.account || "Account"}</Text>
        {user && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {user.email}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.menuItem, { borderColor: Colors.light.error, borderWidth: 1 }]}
          onPress={() => {
            Alert.alert(
              t.settings.signOutConfirm || "Sign Out",
              t.settings.signOutMessage || "Are you sure you want to sign out?",
              [
                { text: t.common.cancel, style: "cancel" },
                {
                  text: t.settings.signOut || "Sign Out",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await signOut();
                      router.replace("/login" as any);
                    } catch (error) {
                      Alert.alert(
                        t.common.error || "Error",
                        error instanceof Error ? error.message : "Failed to sign out"
                      );
                    }
                  },
                },
              ]
            );
          }}
        >
          <View style={styles.menuIcon}>
            <LogOut size={20} color={Colors.light.error} />
          </View>
          <Text style={[styles.menuText, { color: Colors.light.error }]}>
            {t.settings.signOut || "Sign Out"}
          </Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  flagBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  flagBadgeActive: {
    backgroundColor: "#FFFFFF20",
    borderColor: "#FFFFFF80",
  },
  flagEmoji: {
    fontSize: 22,
  },
  levelContainer: {
    gap: 12,
  },
  levelButton: {
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
  levelButtonActive: {
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  levelTextContainer: {
    flex: 1,
  },
  levelButtonTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  levelButtonDescription: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 16,
    lineHeight: 20,
  },
});
