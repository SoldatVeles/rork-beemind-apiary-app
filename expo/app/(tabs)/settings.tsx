import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from "react-native";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Database, Download, Trash2, Info, ChevronRight, Activity, FileText, Sprout, TrendingUp, Award, LogOut, Crown, RefreshCw } from "lucide-react-native";
import { Switch } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import { useLanguage } from "@/store/language-store";
import { LANGUAGE_FLAGS, LANGUAGE_FLAG_CODES, LANGUAGE_NATIVE_LABELS, SUPPORTED_LANGUAGES, type Language } from "@/constants/translations";
import { useUserPreferences, type ExperienceLevel } from "@/store/user-preferences-store";
import { useAuth } from "@/store/auth-store";
import { usePro } from "@/store/pro-store";
import UpgradeModal from "@/components/UpgradeModal";
import DataExportSheet from "@/components/DataExportSheet";
import { trackEvent } from "@/lib/analytics";
import { clearPersistedQueryCache } from "@/lib/query-client";
import { useState } from "react";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { yards, hives, inspections, tasks, queens, harvests, devices, deleteYard, deleteHive, deleteQueen, deleteInspection, deleteTask, deleteHarvest, deleteDevice } = useBeeMind();
  const { language, setLanguage, t } = useLanguage();
  const { experienceLevel, setExperienceLevel } = useUserPreferences();
  const { signOut, user } = useAuth();
  const { isPro, togglePro, isDevOverride, refreshEntitlement } = usePro();
  const [upgradeVisible, setUpgradeVisible] = useState<boolean>(false);
  const [exportVisible, setExportVisible] = useState<boolean>(false);
  const proCopy = (t as unknown as { pro?: Record<string, string> }).pro ?? {};
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
    if (!isPro) {
      console.log("[Settings] export blocked, opening upgrade modal");
      setUpgradeVisible(true);
      return;
    }
    setExportVisible(true);
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

  const handleRestorePurchases = async () => {
    try {
      const Purchases = (await import("react-native-purchases")).default;
      const { configurePurchases } = await import("@/lib/revenuecat");
      if (!configurePurchases()) {
        Alert.alert(t.common.error, "Purchases not available right now.");
        return;
      }
      const info = await Purchases.restorePurchases();
      await refreshEntitlement();
      const hasPro = info.entitlements.active.pro !== undefined;
      Alert.alert(
        hasPro ? (t.common.success) : (proCopy.restoreEmptyTitle ?? "No purchases found"),
        hasPro
          ? (proCopy.restoreSuccessMessage ?? "Your Pro access has been restored.")
          : (proCopy.restoreEmptyMessage ?? "We couldn't find any active subscriptions on this account."),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t.common.error, message);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear cached data?",
      "This removes the offline query cache. Your data on the server is not affected.",
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: "Clear cache",
          style: "destructive",
          onPress: async () => {
            try {
              await clearPersistedQueryCache();
              Alert.alert(t.common.success, "Cache cleared.");
            } catch (error) {
              console.log("[Settings] clear cache failed", error);
              Alert.alert(t.common.error, "Failed to clear cache");
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const getLanguageName = (lang: Language) => LANGUAGE_NATIVE_LABELS[lang];

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
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              testID={`language-${lang}`}
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
                <Image
                  source={{ uri: `https://flagcdn.com/w80/${LANGUAGE_FLAG_CODES[lang]}.png` }}
                  style={styles.flagImage}
                  resizeMode="cover"
                  accessibilityLabel={`${getLanguageName(lang)} flag`}
                />
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
        <View style={styles.proHeaderRow}>
          <Text style={styles.sectionTitle}>{proCopy.sectionTitle ?? "BeeMind Pro"}</Text>
          <View style={[styles.proStatusPill, isPro ? styles.proStatusPillPro : styles.proStatusPillFree]}>
            <Crown size={12} color={isPro ? "#FFFFFF" : Colors.light.primary} />
            <Text style={[styles.proStatusPillText, { color: isPro ? "#FFFFFF" : Colors.light.primary }]}>
              {isPro ? (proCopy.statusPro ?? "Pro Plan") : (proCopy.statusFree ?? "Free Plan")}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionDescription}>
          {isPro ? (proCopy.proDescription ?? "You have full access to all BeeMind features.") : (proCopy.freeDescription ?? "Up to 3 hives, basic tracking. Upgrade to unlock everything.")}
        </Text>
        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => setUpgradeVisible(true)}
            testID="settings-upgrade-button"
          >
            <View style={styles.upgradeIcon}>
              <Crown size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.upgradeCardText}>{proCopy.upgradeButton ?? "Upgrade to Pro"}</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleRestorePurchases}
          testID="settings-restore-purchases"
        >
          <View style={styles.menuIcon}>
            <RefreshCw size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.menuText}>{proCopy.restore ?? "Restore Purchases"}</Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
        <View style={styles.devToggleRow}>
          <View style={styles.devToggleTextWrap}>
            <Text style={styles.devToggleTitle}>{proCopy.devToggle ?? "Enable Pro (Dev Mode)"}</Text>
            <Text style={styles.devToggleHint}>{proCopy.devToggleHint ?? "Temporarily simulate a Pro account for testing."}</Text>
          </View>
          <Switch
            value={isDevOverride}
            onValueChange={async () => {
              const next = !isDevOverride;
              await togglePro();
              if (next) {
                trackEvent("pro_enabled_dev");
              }
            }}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor="#FFFFFF"
            testID="settings-pro-dev-toggle"
          />
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
        <TouchableOpacity style={styles.menuItem} onPress={handleExport} testID="settings-export-button">
          <View style={styles.menuIcon}>
            {isPro ? (
              <Download size={20} color={Colors.light.primary} />
            ) : (
              <Crown size={20} color={Colors.light.primary} />
            )}
          </View>
          <Text style={styles.menuText}>
            {t.settings.exportData}
            {!isPro ? `  ·  ${proCopy.badge ?? "Pro"}` : ""}
          </Text>
          <ChevronRight size={20} color={Colors.light.tabIconDefault} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleClearCache} testID="clear-cache">
          <View style={styles.menuIcon}>
            <RefreshCw size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.menuText}>Clear cache</Text>
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
      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        reason={proCopy.reportExportLocked ?? "Exporting data is a Pro feature."}
      />
      <DataExportSheet
        visible={exportVisible}
        onClose={() => setExportVisible(false)}
        onLockedTap={() => setUpgradeVisible(true)}
      />
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
  flagImage: {
    width: 36,
    height: 26,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
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
  proHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  proStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  proStatusPillFree: {
    backgroundColor: Colors.light.primary + "15",
    borderColor: Colors.light.primary + "40",
  },
  proStatusPillPro: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  proStatusPillText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  upgradeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeCardText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  devToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  devToggleTextWrap: {
    flex: 1,
  },
  devToggleTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  devToggleHint: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 16,
    lineHeight: 20,
  },
});
