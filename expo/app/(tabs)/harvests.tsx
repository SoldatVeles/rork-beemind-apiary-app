import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Modal, TextInput, Alert } from "react-native";
import { Package, Plus, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";

export default function HarvestsScreen() {
  const { harvests, yards, hives, addHarvest, queryStates } = useBeeMind();
  const harvestsState = queryStates.harvests;
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    yard_id: "",
    hive_id: "",
    frames_spun: "",
    weight_kg: "",
    moisture_pct: "",
    lot_code: "",
    notes: "",
  });

  const getYardName = (yardId?: string) => {
    if (!yardId) return "Multiple Yards";
    return yards.find((y) => y.id === yardId)?.name || "Unknown Yard";
  };

  const getHiveLabel = (hiveId?: string) => {
    if (!hiveId) return "Multiple Hives";
    return hives.find((h) => h.id === hiveId)?.label || "Unknown Hive";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleSubmit = () => {
    const frames = parseInt(formData.frames_spun, 10);
    const weight = parseFloat(formData.weight_kg);
    const moisture = formData.moisture_pct ? parseFloat(formData.moisture_pct) : undefined;

    if (!formData.frames_spun.trim() || !formData.weight_kg.trim()) {
      Alert.alert("Missing fields", "Please enter both frames spun and weight (kg).");
      return;
    }
    if (Number.isNaN(frames) || frames <= 0) {
      Alert.alert("Invalid frames", "Frames spun must be a positive number.");
      return;
    }
    if (Number.isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid weight", "Harvest weight must be greater than zero.");
      return;
    }
    if (moisture !== undefined && (Number.isNaN(moisture) || moisture < 0 || moisture > 100)) {
      Alert.alert("Invalid moisture", "Moisture must be between 0 and 100%.");
      return;
    }

    addHarvest({
      yard_id: formData.yard_id || undefined,
      hive_id: formData.hive_id || undefined,
      frames_spun: frames,
      weight_kg: weight,
      moisture_pct: moisture,
      lot_code: formData.lot_code || undefined,
      notes: formData.notes || undefined,
    });

    setFormData({
      yard_id: "",
      hive_id: "",
      frames_spun: "",
      weight_kg: "",
      moisture_pct: "",
      lot_code: "",
      notes: "",
    });
    setModalVisible(false);
    Alert.alert("Success", "Harvest recorded successfully");
  };

  const sortedHarvests = harvests.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalWeight = harvests.reduce((sum, h) => sum + h.weight_kg, 0);
  const avgMoisture =
    harvests.filter((h) => h.moisture_pct).length > 0
      ? harvests.reduce((sum, h) => sum + (h.moisture_pct || 0), 0) /
        harvests.filter((h) => h.moisture_pct).length
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{harvests.length}</Text>
          <Text style={styles.statLabel}>Total Batches</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWeight.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Total kg</Text>
        </View>
        {avgMoisture > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgMoisture.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Avg Moisture</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {harvestsState.isLoading && harvests.length === 0 ? (
          <LoadingState message="Loading harvests" testID="harvests-loading" />
        ) : harvestsState.isError && harvests.length === 0 ? (
          <ErrorState
            message={harvestsState.error?.message ?? "We could not load your harvests."}
            onRetry={() => harvestsState.refetch()}
            testID="harvests-error"
          />
        ) : sortedHarvests.length === 0 ? (
          <EmptyState
            testID="harvests-empty-state"
            icon={<Package size={36} color={Colors.light.primary} />}
            title="No harvests yet"
            message="Track each honey extraction with frames spun, weight and moisture so you can compare seasons."
            actionLabel={hives.length > 0 ? "Record your first harvest" : undefined}
            onAction={hives.length > 0 ? () => setModalVisible(true) : undefined}
          />
        ) : (
          sortedHarvests.map((harvest) => (
            <View key={harvest.id} style={styles.harvestCard}>
              <View style={styles.harvestHeader}>
                <View style={styles.harvestIcon}>
                  <Package size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.harvestContent}>
                  <Text style={styles.harvestDate}>{formatDate(harvest.created_at)}</Text>
                  <Text style={styles.harvestLocation}>
                    {getYardName(harvest.yard_id)} • {getHiveLabel(harvest.hive_id)}
                  </Text>
                </View>
                <View style={styles.harvestWeight}>
                  <Text style={styles.weightValue}>{harvest.weight_kg}</Text>
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
              </View>

              <View style={styles.harvestDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Frames</Text>
                  <Text style={styles.detailValue}>{harvest.frames_spun}</Text>
                </View>
                {harvest.moisture_pct && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Moisture</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        harvest.moisture_pct > 18.6 && styles.detailValueWarning,
                      ]}
                    >
                      {harvest.moisture_pct}%
                    </Text>
                  </View>
                )}
                {harvest.lot_code && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Lot</Text>
                    <Text style={styles.detailValue}>{harvest.lot_code}</Text>
                  </View>
                )}
              </View>

              {harvest.notes && <Text style={styles.harvestNotes}>{harvest.notes}</Text>}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Harvest</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Yard (optional)</Text>
              <View style={styles.pickerContainer}>
                {yards.map((yard) => (
                  <TouchableOpacity
                    key={yard.id}
                    style={[
                      styles.pickerOption,
                      formData.yard_id === yard.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, yard_id: yard.id })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.yard_id === yard.id && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {yard.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Hive (optional)</Text>
              <View style={styles.pickerContainer}>
                {hives.map((hive) => (
                  <TouchableOpacity
                    key={hive.id}
                    style={[
                      styles.pickerOption,
                      formData.hive_id === hive.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, hive_id: hive.id })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.hive_id === hive.id && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {hive.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Frames Spun *</Text>
              <TextInput
                style={styles.input}
                value={formData.frames_spun}
                onChangeText={(text) => setFormData({ ...formData, frames_spun: text })}
                placeholder="e.g., 8"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Weight (kg) *</Text>
              <TextInput
                style={styles.input}
                value={formData.weight_kg}
                onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
                placeholder="e.g., 24.5"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Moisture %</Text>
              <TextInput
                style={styles.input}
                value={formData.moisture_pct}
                onChangeText={(text) => setFormData({ ...formData, moisture_pct: text })}
                placeholder="e.g., 17.5"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Lot Code</Text>
              <TextInput
                style={styles.input}
                value={formData.lot_code}
                onChangeText={(text) => setFormData({ ...formData, lot_code: text })}
                placeholder="e.g., 2025-001"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Quality, color, etc..."
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleSubmit}>
                <Text style={styles.buttonPrimaryText}>Record Harvest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
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
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    textAlign: "center",
  },
  content: {
    padding: 16,
  },
  harvestCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  harvestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  harvestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  harvestContent: {
    flex: 1,
  },
  harvestDate: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  harvestLocation: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  harvestWeight: {
    alignItems: "flex-end",
  },
  weightValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  weightUnit: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  harvestDetails: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  detailValueWarning: {
    color: Colors.light.warning,
  },
  harvestNotes: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 16,
    maxHeight: 150,
  },
  pickerOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.light.primary + "20",
    borderColor: Colors.light.primary,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerOptionTextSelected: {
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  buttonSecondaryText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
