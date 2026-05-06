import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import type {
  BroodPattern,
  HoneyStores,
  PopulationStrength,
} from "@/types";

type Temper = "calm" | "normal" | "aggressive";

interface InspectionFormState {
  brood_pattern: BroodPattern | "";
  population_strength: PopulationStrength | "";
  honey_stores: HoneyStores | "";
  temper: Temper | "";
  eggs_seen: boolean;
  queen_seen: boolean;
  notes: string;
  createFollowUp: boolean;
  followUpTitle: string;
  followUpDueAt: string;
}

const POPULATION_OPTIONS: PopulationStrength[] = ["weak", "medium", "strong"];
const BROOD_OPTIONS: BroodPattern[] = ["none", "poor", "good", "excellent"];
const HONEY_OPTIONS: HoneyStores[] = ["low", "medium", "high"];
const TEMPER_OPTIONS: Temper[] = ["calm", "normal", "aggressive"];

const TEMPER_TO_INT: Record<Temper, number> = {
  calm: 1,
  normal: 3,
  aggressive: 5,
};

const capitalize = (value: string) =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

export default function NewInspectionScreen() {
  const { hive } = useLocalSearchParams<{ hive?: string }>();
  const router = useRouter();
  const { hives, addInspection, addTask } = useBeeMind();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<InspectionFormState>({
    brood_pattern: "",
    population_strength: "",
    honey_stores: "",
    temper: "",
    eggs_seen: false,
    queen_seen: false,
    notes: "",
    createFollowUp: false,
    followUpTitle: "",
    followUpDueAt: "",
  });

  const selectedHive = useMemo(
    () => hives.find((h) => h.id === hive),
    [hive, hives]
  );

  const update = <K extends keyof InspectionFormState>(
    key: K,
    value: InspectionFormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!hive) {
      Alert.alert("Error", "No hive selected");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      await addInspection({
        hive_id: hive,
        performed_at: new Date().toISOString(),
        brood_pattern: formData.brood_pattern || undefined,
        population_strength: formData.population_strength || undefined,
        honey_stores: formData.honey_stores || undefined,
        eggs_seen: formData.eggs_seen,
        queen_seen: formData.queen_seen,
        temper: formData.temper ? TEMPER_TO_INT[formData.temper] : undefined,
        notes: formData.notes.trim() || undefined,
      });

      if (formData.createFollowUp) {
        const title = formData.followUpTitle.trim() || `Follow up on ${selectedHive?.label ?? "hive"}`;
        await addTask({
          scope: "hive",
          hive_id: hive,
          title,
          due_at: formData.followUpDueAt.trim() || undefined,
          priority: 2,
          is_done: false,
        });
      }

      Alert.alert("Success", "Inspection recorded", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("[NewInspection] failed", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Could not save inspection"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderChoiceRow = <T extends string>(
    options: readonly T[],
    selected: T | "",
    onPick: (value: T) => void,
    testIdPrefix: string
  ) => (
    <View style={styles.optionGroup}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.optionButton, active && styles.optionButtonActive]}
            onPress={() => onPick(option)}
            testID={`${testIdPrefix}-${option}`}
          >
            <Text
              style={[
                styles.optionButtonText,
                active && styles.optionButtonTextActive,
              ]}
            >
              {capitalize(option)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderToggle = (
    label: string,
    value: boolean,
    onToggle: () => void,
    testID: string
  ) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onToggle}
      testID={testID}
    >
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Check size={16} color="#FFFFFF" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ title: "New Inspection" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hiveInfo}>
          <Text style={styles.hiveLabel}>{selectedHive?.label ?? "Unknown Hive"}</Text>
          <Text style={styles.hiveDate}>{new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Population Strength</Text>
          {renderChoiceRow(
            POPULATION_OPTIONS,
            formData.population_strength,
            (value) => update("population_strength", value),
            "inspection-pop"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brood Pattern</Text>
          {renderChoiceRow(
            BROOD_OPTIONS,
            formData.brood_pattern,
            (value) => update("brood_pattern", value),
            "inspection-brood"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Honey Stores</Text>
          {renderChoiceRow(
            HONEY_OPTIONS,
            formData.honey_stores,
            (value) => update("honey_stores", value),
            "inspection-honey"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temperament</Text>
          {renderChoiceRow(
            TEMPER_OPTIONS,
            formData.temper,
            (value) => update("temper", value),
            "inspection-temper"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observations</Text>
          {renderToggle(
            "Eggs seen",
            formData.eggs_seen,
            () => update("eggs_seen", !formData.eggs_seen),
            "inspection-eggs"
          )}
          {renderToggle(
            "Queen seen",
            formData.queen_seen,
            () => update("queen_seen", !formData.queen_seen),
            "inspection-queen"
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => update("notes", text)}
            placeholder="Additional observations..."
            placeholderTextColor={Colors.light.tabIconDefault}
            multiline
            numberOfLines={6}
            testID="inspection-notes"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-up</Text>
          {renderToggle(
            "Create a follow-up task",
            formData.createFollowUp,
            () => update("createFollowUp", !formData.createFollowUp),
            "inspection-followup-toggle"
          )}
          {formData.createFollowUp && (
            <View style={styles.followUpBlock}>
              <Text style={styles.label}>Task title</Text>
              <TextInput
                style={styles.input}
                value={formData.followUpTitle}
                onChangeText={(text) => update("followUpTitle", text)}
                placeholder={`Follow up on ${selectedHive?.label ?? "hive"}`}
                placeholderTextColor={Colors.light.tabIconDefault}
                testID="inspection-followup-title"
              />
              <Text style={styles.label}>Due date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.followUpDueAt}
                onChangeText={(text) => update("followUpDueAt", text)}
                placeholder="Optional"
                placeholderTextColor={Colors.light.tabIconDefault}
                testID="inspection-followup-due"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          testID="inspection-submit"
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Saving..." : "Save Inspection"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
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
  hiveInfo: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
  hiveLabel: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  hiveDate: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    flexGrow: 1,
    flexBasis: "30%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  optionButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  optionButtonTextActive: {
    color: "#FFFFFF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  followUpBlock: {
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600" as const,
  },
});
