import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import type { BroodPattern } from "@/types";

export default function NewInspectionScreen() {
  const { hive } = useLocalSearchParams<{ hive: string }>();
  const router = useRouter();
  const { hives, addInspection } = useBeeMind();
  const [formData, setFormData] = useState({
    brood_pattern: "" as BroodPattern | "",
    eggs_seen: false,
    larvae_seen: false,
    stores_kg: "",
    mites_per_100: "",
    temper: "",
    supers_delta: "",
    notes: "",
  });

  const selectedHive = hives.find((h) => h.id === hive);

  const handleSubmit = () => {
    if (!hive) {
      Alert.alert("Error", "No hive selected");
      return;
    }

    addInspection({
      hive_id: hive,
      performed_at: new Date().toISOString(),
      brood_pattern: formData.brood_pattern || undefined,
      eggs_seen: formData.eggs_seen,
      larvae_seen: formData.larvae_seen,
      stores_kg: formData.stores_kg ? parseFloat(formData.stores_kg) : undefined,
      mites_per_100: formData.mites_per_100 ? parseFloat(formData.mites_per_100) : undefined,
      temper: formData.temper ? parseInt(formData.temper) : undefined,
      supers_delta: formData.supers_delta ? parseInt(formData.supers_delta) : undefined,
      notes: formData.notes || undefined,
    });

    Alert.alert("Success", "Inspection recorded successfully", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "New Inspection" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hiveInfo}>
          <Text style={styles.hiveLabel}>{selectedHive?.label || "Unknown Hive"}</Text>
          <Text style={styles.hiveDate}>{new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brood Pattern</Text>
          <View style={styles.optionGroup}>
            {(["solid", "spotty", "none"] as const).map((pattern) => (
              <TouchableOpacity
                key={pattern}
                style={[
                  styles.optionButton,
                  formData.brood_pattern === pattern && styles.optionButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, brood_pattern: pattern })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    formData.brood_pattern === pattern && styles.optionButtonTextActive,
                  ]}
                >
                  {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observations</Text>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, eggs_seen: !formData.eggs_seen })}
          >
            <View style={[styles.checkbox, formData.eggs_seen && styles.checkboxChecked]}>
              {formData.eggs_seen && <Check size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Eggs Seen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setFormData({ ...formData, larvae_seen: !formData.larvae_seen })}
          >
            <View style={[styles.checkbox, formData.larvae_seen && styles.checkboxChecked]}>
              {formData.larvae_seen && <Check size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Larvae Seen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          
          <Text style={styles.label}>Stores (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.stores_kg}
            onChangeText={(text) => setFormData({ ...formData, stores_kg: text })}
            placeholder="e.g., 15"
            placeholderTextColor={Colors.light.tabIconDefault}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Mites per 100 bees</Text>
          <TextInput
            style={styles.input}
            value={formData.mites_per_100}
            onChangeText={(text) => setFormData({ ...formData, mites_per_100: text })}
            placeholder="e.g., 2.5"
            placeholderTextColor={Colors.light.tabIconDefault}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Temperament (1-5)</Text>
          <View style={styles.ratingGroup}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  formData.temper === rating.toString() && styles.ratingButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, temper: rating.toString() })}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    formData.temper === rating.toString() && styles.ratingButtonTextActive,
                  ]}
                >
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Supers Added/Removed</Text>
          <TextInput
            style={styles.input}
            value={formData.supers_delta}
            onChangeText={(text) => setFormData({ ...formData, supers_delta: text })}
            placeholder="e.g., +1 or -1"
            placeholderTextColor={Colors.light.tabIconDefault}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Additional observations..."
            placeholderTextColor={Colors.light.tabIconDefault}
            multiline
            numberOfLines={6}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Save Inspection</Text>
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
    gap: 8,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
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
    paddingVertical: 12,
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
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  ratingGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  ratingButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ratingButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  ratingButtonTextActive: {
    color: "#FFFFFF",
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
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600" as const,
  },
});
