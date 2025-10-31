import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  level: ExperienceLevel;
}

interface UserPreferencesState {
  experienceLevel?: ExperienceLevel;
  hasCompletedOnboarding: boolean;
  dismissedTips: string[];
  unlockedFeatures: string[];
  
  setExperienceLevel: (level: ExperienceLevel) => void;
  completeOnboarding: () => void;
  dismissTip: (tipId: string) => void;
  unlockFeature: (featureId: string) => void;
  canAccessFeature: (featureId: string) => boolean;
}

const BEGINNER_FEATURES = [
  "basic_hive_management",
  "simple_inspections",
  "task_tracking",
];

const INTERMEDIATE_FEATURES = [
  ...BEGINNER_FEATURES,
  "queen_tracking",
  "harvest_tracking",
  "yard_management",
];

const ADVANCED_FEATURES = [
  ...INTERMEDIATE_FEATURES,
  "device_monitoring",
  "advanced_reports",
  "treatment_tracking",
  "inventory_management",
];

export const useUserPreferences = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      experienceLevel: undefined,
      hasCompletedOnboarding: false,
      dismissedTips: [],
      unlockedFeatures: [],

      setExperienceLevel: (level) => {
        set({ experienceLevel: level });
        
        let features: string[] = [];
        if (level === "beginner") {
          features = BEGINNER_FEATURES;
        } else if (level === "intermediate") {
          features = INTERMEDIATE_FEATURES;
        } else if (level === "advanced") {
          features = ADVANCED_FEATURES;
        }
        
        set({ unlockedFeatures: features });
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      dismissTip: (tipId) =>
        set((state) => ({
          dismissedTips: [...state.dismissedTips, tipId],
        })),

      unlockFeature: (featureId) =>
        set((state) => ({
          unlockedFeatures: [...state.unlockedFeatures, featureId],
        })),

      canAccessFeature: (featureId) => {
        const { experienceLevel, unlockedFeatures } = get();
        
        if (experienceLevel === "advanced") return true;
        
        return unlockedFeatures.includes(featureId);
      },
    }),
    {
      name: "user-preferences-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
