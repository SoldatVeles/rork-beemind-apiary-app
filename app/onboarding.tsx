import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Sprout, TrendingUp, Award, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useUserPreferences, type ExperienceLevel } from "@/store/user-preferences-store";
import { useLanguage } from "@/store/language-store";

interface LevelOption {
  level: ExperienceLevel;
  icon: typeof Sprout;
  title: string;
  description: string;
  features: string[];
  color: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setExperienceLevel, completeOnboarding } = useUserPreferences();
  const { t } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);

  const levels: LevelOption[] = [
    {
      level: "beginner",
      icon: Sprout,
      title: t.onboarding?.beginner || "Beginner",
      description: t.onboarding?.beginnerDesc || "Just starting your beekeeping journey",
      features: [
        "Simple hive tracking",
        "Basic inspection logs",
        "Task reminders",
        "Educational tips & guides",
        "Progressive feature unlock",
      ],
      color: "#10B981",
    },
    {
      level: "intermediate",
      icon: TrendingUp,
      title: t.onboarding?.intermediate || "Intermediate",
      description: t.onboarding?.intermediateDesc || "Managing a growing apiary",
      features: [
        "All beginner features",
        "Queen tracking & genetics",
        "Harvest management",
        "Multiple yard organization",
        "Advanced analytics",
      ],
      color: "#F59E0B",
    },
    {
      level: "advanced",
      icon: Award,
      title: t.onboarding?.advanced || "Advanced",
      description: t.onboarding?.advancedDesc || "Professional beekeeper",
      features: [
        "All features unlocked",
        "IoT device integration",
        "Treatment protocols",
        "Inventory management",
        "Comprehensive reporting",
      ],
      color: "#8B5CF6",
    },
  ];

  const handleContinue = () => {
    if (selectedLevel) {
      setExperienceLevel(selectedLevel);
      completeOnboarding();
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to BeeMind! 🐝</Text>
        <Text style={styles.subtitle}>
          Choose your experience level to customize your beekeeping journey
        </Text>
      </View>

      {levels.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedLevel === option.level;

        return (
          <TouchableOpacity
            key={option.level}
            style={[
              styles.levelCard,
              isSelected && styles.levelCardSelected,
              { borderColor: isSelected ? option.color : Colors.light.border },
            ]}
            onPress={() => setSelectedLevel(option.level)}
            activeOpacity={0.7}
          >
            <View style={styles.levelHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: option.color + "20" },
                ]}
              >
                <Icon size={32} color={option.color} />
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>{option.title}</Text>
                <Text style={styles.levelDescription}>{option.description}</Text>
              </View>
              {isSelected && (
                <CheckCircle size={24} color={option.color} style={styles.checkIcon} />
              )}
            </View>

            <View style={styles.featuresContainer}>
              {option.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View
                    style={[
                      styles.featureDot,
                      { backgroundColor: option.color },
                    ]}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedLevel && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!selectedLevel}
      >
        <Text style={styles.continueButtonText}>
          {t.common?.continue || "Continue to BeeMind"}
        </Text>
      </TouchableOpacity>

        <Text style={styles.footerNote}>
          💡 Don&apos;t worry! You can always change your level later in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 22,
  },
  levelCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  levelCardSelected: {
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  checkIcon: {
    marginLeft: 8,
  },
  featuresContainer: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.light.tabIconDefault,
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  footerNote: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 20,
  },
});
