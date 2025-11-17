import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Hexagon, Map as MapIcon, Plus, Search, X, Navigation } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "../../../constants/colors";
import { useBeeMindStore } from "../../../store/beemind-store";
import type { Hive, HiveStatus } from "../../../types";
import MapLocationPicker from "@/components/hives/MapLocationPicker";

interface HiveFormState {
  yard_id: string;
  label: string;
  hive_type: string;
  frames: string;
  status: HiveStatus;
  latitude: string;
  longitude: string;
  notes: string;
}

interface HiveLocation {
  latitude: number;
  longitude: number;
  source: "hive" | "yard";
}

export default function HivesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hives, yards, addHive } = useBeeMindStore();
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<HiveStatus | "All">("All");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [mapPickerVisible, setMapPickerVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState<HiveFormState>({
    yard_id: "",
    label: "",
    hive_type: "Langstroth",
    frames: "10",
    status: "Active",
    latitude: "",
    longitude: "",
    notes: "",
  });

  const getHiveLocation = useCallback(
    (hive: Hive): HiveLocation | null => {
      if (typeof hive.latitude === "number" && typeof hive.longitude === "number") {
        return {
          latitude: hive.latitude,
          longitude: hive.longitude,
          source: "hive",
        };
      }

      const yard = yards.find((y) => y.id === hive.yard_id);

      if (yard && typeof yard.latitude === "number" && typeof yard.longitude === "number") {
        return {
          latitude: yard.latitude,
          longitude: yard.longitude,
          source: "yard",
        };
      }

      return null;
    },
    [yards],
  );

  const filteredHives = useMemo(() => {
    return hives.filter((hive) => {
      const matchesSearch = hive.label.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || hive.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hives, search, statusFilter]);

  const hivesWithLocation = useMemo(() => {
    return hives.filter((hive) => getHiveLocation(hive) !== null);
  }, [getHiveLocation, hives]);

  const hasHivesWithLocation = hivesWithLocation.length > 0;

  const getYardName = (yardId: string) => {
    return yards.find((y) => y.id === yardId)?.name || "Unknown Yard";
  };

  const getStatusColor = (status: HiveStatus) => {
    switch (status) {
      case "Active":
        return Colors.light.success;
      case "Split":
        return Colors.light.warning;
      case "Deadout":
        return Colors.light.error;
      default:
        return Colors.light.tabIconDefault;
    }
  };



  const parseCoordinate = (value: string) => {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  };

  const handleSubmit = () => {
    console.log("[HivesScreen] submit new hive", formData);

    if (!formData.label.trim()) {
      Alert.alert("Error", "Hive label is required");
      return;
    }

    if (!formData.yard_id) {
      Alert.alert("Error", "Please select a yard");
      return;
    }

    const latitudeValue = parseCoordinate(formData.latitude);
    const longitudeValue = parseCoordinate(formData.longitude);

    if (latitudeValue === null || longitudeValue === null) {
      Alert.alert("Error", "Latitude and longitude must be valid numbers");
      return;
    }

    if ((latitudeValue === undefined) !== (longitudeValue === undefined)) {
      Alert.alert("Error", "Please provide both latitude and longitude or leave both empty.");
      return;
    }

    const framesValue = Number.parseInt(formData.frames, 10);

    if (Number.isNaN(framesValue) || framesValue <= 0) {
      Alert.alert("Error", "Please provide a valid number of frames");
      return;
    }

    addHive({
      yard_id: formData.yard_id,
      label: formData.label.trim(),
      hive_type: formData.hive_type.trim() || "Langstroth",
      frames: framesValue,
      status: formData.status,
      latitude: latitudeValue,
      longitude: longitudeValue,
      notes: formData.notes.trim() || undefined,
    });

    setFormData({
      yard_id: "",
      label: "",
      hive_type: "Langstroth",
      frames: "10",
      status: "Active",
      latitude: "",
      longitude: "",
      notes: "",
    });
    setModalVisible(false);
    Alert.alert("Success", "Hive created successfully");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      {hasHivesWithLocation && (
        <TouchableOpacity
          style={styles.mapPreviewCard}
          onPress={() => setMapModalVisible(true)}
          testID="open-map-modal"
        >
          <View style={styles.mapPreviewHeader}>
            <MapIcon size={20} color="#FFFFFF" />
            <Text style={styles.mapPreviewTitle}>View All Hives on Map</Text>
          </View>
          <Text style={styles.mapPreviewSubtitle}>
            {hivesWithLocation.length} {hivesWithLocation.length === 1 ? "hive" : "hives"} with location
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.light.tabIconDefault} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hives..."
            placeholderTextColor={Colors.light.tabIconDefault}
            value={search}
            onChangeText={setSearch}
            testID="hive-search-input"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {(["All", "Active", "Split", "Deadout"] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            onPress={() => setStatusFilter(status)}
            testID={`filter-${status}`}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === status && styles.filterChipTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredHives.length === 0 ? (
          <View style={styles.emptyState}>
            <Hexagon size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>No Hives Found</Text>
            <Text style={styles.emptyText}>
              {search ? "Try a different search" : "Add your first hive to get started"}
            </Text>
          </View>
        ) : (
          filteredHives.map((hive) => {
            const location = getHiveLocation(hive);
            return (
              <TouchableOpacity
                key={hive.id}
                style={styles.hiveCard}
                onPress={() =>
                  router.push({ pathname: "/(tabs)/hives/[id]", params: { id: hive.id } })
                }
                testID={`hive-card-${hive.id}`}
              >
                <View style={styles.hiveHeader}>
                  <View style={styles.hiveIcon}>
                    <Hexagon size={24} color={Colors.light.primary} />
                  </View>
                  <View style={styles.hiveContent}>
                    <Text style={styles.hiveLabel}>{hive.label}</Text>
                    <Text style={styles.hiveYard}>{getYardName(hive.yard_id)}</Text>
                    {location && (
                      <Text style={styles.hiveCoords}>
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(hive.status)}20` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(hive.status) }]}>
                      {hive.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.hiveDetails}>
                  <Text style={styles.hiveDetail}>Type: {hive.hive_type}</Text>
                  <Text style={styles.hiveDetail}>Frames: {hive.frames}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        testID="add-hive-button"
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={mapModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.mapModal}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>All Hives</Text>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} testID="close-map-modal">
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.webMapContainer}>
            <Text style={styles.mapPlaceholder}>🗺️ Hive Locations</Text>
            <Text style={styles.mapSubtext}>
              Tap any hive below to view its details and location
            </Text>
            <ScrollView style={styles.hivesListInMap}>
              {hivesWithLocation.map((hive) => {
                const yard = yards.find((y) => y.id === hive.yard_id);
                const location = getHiveLocation(hive);
                if (!location) {
                  return null;
                }

                return (
                  <TouchableOpacity
                    key={hive.id}
                    style={styles.hiveInMapButton}
                    onPress={() => {
                      console.log("[HivesScreen] opening hive detail from map list", { hiveId: hive.id });
                      setMapModalVisible(false);
                      router.push({ pathname: "/(tabs)/hives/[id]", params: { id: hive.id } });
                    }}
                    activeOpacity={0.85}
                    testID={`map-list-${hive.id}`}
                  >
                    <View style={styles.hiveInMapIcon}>
                      <Hexagon size={20} color={Colors.light.primary} />
                    </View>
                    <View style={styles.hiveInMapContent}>
                      <Text style={styles.hiveInMapText}>{hive.label}</Text>
                      <Text style={styles.hiveInMapYard}>{yard?.name ?? "Unknown yard"}</Text>
                      <Text style={styles.hiveInMapCoords}>
                        📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        {location.source === "yard" ? " (yard)" : ""}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.mapStatusBadge,
                        { backgroundColor: `${getStatusColor(hive.status)}20` },
                      ]}
                    >
                      <Text style={[styles.mapStatusText, { color: getStatusColor(hive.status) }]}>
                        {hive.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Hive</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} testID="close-hive-modal">
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Yard *</Text>
              <View style={styles.pickerContainer}>
                {yards.map((yard) => (
                  <TouchableOpacity
                    key={yard.id}
                    style={[
                      styles.pickerOption,
                      formData.yard_id === yard.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, yard_id: yard.id }))}
                    testID={`select-yard-${yard.id}`}
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

              <Text style={styles.label}>Label *</Text>
              <TextInput
                style={styles.input}
                value={formData.label}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, label: text }))}
                placeholder="e.g., Hive 1"
                placeholderTextColor={Colors.light.tabIconDefault}
                autoCapitalize="words"
                testID="input-hive-label"
              />

              <Text style={styles.label}>Hive Type</Text>
              <TextInput
                style={styles.input}
                value={formData.hive_type}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, hive_type: text }))}
                placeholder="e.g., Langstroth"
                placeholderTextColor={Colors.light.tabIconDefault}
                testID="input-hive-type"
              />

              <Text style={styles.label}>Number of Frames</Text>
              <TextInput
                style={styles.input}
                value={formData.frames}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, frames: text }))}
                placeholder="e.g., 10"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="number-pad"
                testID="input-hive-frames"
              />

              <Text style={styles.label}>Status</Text>
              <View style={styles.statusGroup}>
                {(["Active", "Split", "Deadout"] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusChip,
                      formData.status === status && styles.statusChipActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, status }))}
                    testID={`input-status-${status}`}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        formData.status === status && styles.statusChipTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Coordinates</Text>
              <TouchableOpacity
                style={styles.mapPickerButton}
                onPress={() => setMapPickerVisible(true)}
                testID="open-map-picker"
              >
                <Navigation size={20} color={Colors.light.primary} />
                <View style={styles.mapPickerContent}>
                  {formData.latitude && formData.longitude ? (
                    <>
                      <Text style={styles.mapPickerTextPrimary}>Location Set</Text>
                      <Text style={styles.mapPickerTextSecondary}>
                        {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.mapPickerTextPrimary}>Tap to select on map</Text>
                      <Text style={styles.mapPickerTextSecondary}>Drop a pin on the map</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={formData.notes}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, notes: text }))}
                placeholder="Access details, temperament cues, seasonal reminders..."
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                testID="input-hive-notes"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalVisible(false)}
                testID="cancel-hive-creation"
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSubmit}
                testID="submit-hive-creation"
              >
                <Text style={styles.buttonPrimaryText}>Create Hive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={mapPickerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMapPickerVisible(false)}
      >
        <MapLocationPicker
          initialLatitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
          initialLongitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
          onConfirm={(latitude, longitude) => {
            console.log("[HivesScreen] location confirmed", { latitude, longitude });
            setFormData((prev) => ({
              ...prev,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            }));
            setMapPickerVisible(false);
          }}
          onCancel={() => setMapPickerVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: 50,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  content: {
    padding: 16,
  },
  hiveCard: {
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
  hiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  hiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  hiveContent: {
    flex: 1,
  },
  hiveLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  hiveYard: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  hiveCoords: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  hiveDetails: {
    flexDirection: "row",
    gap: 16,
  },
  hiveDetail: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
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
  helperLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pickerContainer: {
    marginBottom: 16,
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
  notesInput: {
    minHeight: 108,
  },
  statusGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.tabIconDefault,
  },
  statusChipTextActive: {
    color: "#FFFFFF",
  },
  coordinatesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  coordinateField: {
    flex: 1,
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
  mapPreviewCard: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  mapPreviewTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  mapPreviewSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  mapModal: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  mapModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.select({ ios: 60, default: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  webMapContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  mapPlaceholder: {
    fontSize: 32,
    marginBottom: 12,
  },
  mapSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    marginBottom: 20,
  },
  hivesListInMap: {
    width: "100%",
  },
  hiveInMapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  hiveInMapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  hiveInMapContent: {
    flex: 1,
  },
  hiveInMapText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  hiveInMapYard: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 2,
  },
  hiveInMapCoords: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  mapStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mapStatusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  mapPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  mapPickerContent: {
    flex: 1,
  },
  mapPickerTextPrimary: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  mapPickerTextSecondary: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
});
