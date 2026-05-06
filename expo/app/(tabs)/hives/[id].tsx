import { useEffect, useMemo, useState } from "react";
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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Hexagon,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Crown,
  CheckSquare,
  X,
  Pill,
  MapPin,
  MapPinned,
  Navigation,
} from "lucide-react-native";
import Colors from "../../../constants/colors";
import type { HiveStatus } from "../../../types";
import MapViewComponent from "@/components/hives/MapView";
import MapLocationPicker from "@/components/hives/MapLocationPicker";
import { useBeeMind } from "@/store/beemind-context";

interface HiveEditFormState {
  yard_id: string;
  label: string;
  hive_type: string;
  frames: string;
  status: HiveStatus;
  latitude: string;
  longitude: string;
  notes: string;
}

type LocationSource = "hive" | "yard";

interface HiveLocationDetail {
  latitude: number;
  longitude: number;
  source: LocationSource;
}

type TabType = "overview" | "inspections" | "queen" | "tasks" | "treatments";

const STATUS_OPTIONS: HiveStatus[] = ["Active", "Split", "Deadout"];

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

export default function HiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    yards,
    hives,
    queens,
    inspections,
    tasks,
    treatments,
    updateHive,
    deleteHive,
    addQueen,
    updateQueen,
    addTreatment,
    deleteTreatment,
  } = useBeeMind();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [queenModalVisible, setQueenModalVisible] = useState<boolean>(false);
  const [treatmentModalVisible, setTreatmentModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [mapPickerVisible, setMapPickerVisible] = useState<boolean>(false);
  const [queenFormData, setQueenFormData] = useState({
    hatch_date: "",
    origin: "",
    mark_color: "",
    temperament: "",
    notes: "",
  });
  const [treatmentFormData, setTreatmentFormData] = useState({
    product: "",
    dose: "",
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [editForm, setEditForm] = useState<HiveEditFormState>({
    yard_id: "",
    label: "",
    hive_type: "",
    frames: "",
    status: "Active",
    latitude: "",
    longitude: "",
    notes: "",
  });

  const hive = hives.find((h) => h.id === id);
  const yard = hive ? yards.find((y) => y.id === hive.yard_id) : undefined;
  const queen = queens.find((q) => q.hive_id === id && q.status === "Active");
  const hiveInspections = inspections.filter((i) => i.hive_id === id);
  const hiveTasks = tasks.filter((t) => t.hive_id === id);
  const hiveTreatments = treatments.filter((t) => t.hive_id === id);

  const location = useMemo<HiveLocationDetail | null>(() => {
    if (!hive) {
      return null;
    }

    if (typeof hive.latitude === "number" && typeof hive.longitude === "number") {
      return {
        latitude: hive.latitude,
        longitude: hive.longitude,
        source: "hive",
      };
    }

    if (yard && typeof yard.latitude === "number" && typeof yard.longitude === "number") {
      return {
        latitude: yard.latitude,
        longitude: yard.longitude,
        source: "yard",
      };
    }

    return null;
  }, [hive, yard]);

  useEffect(() => {
    if (hive && editModalVisible) {
      setEditForm({
        yard_id: hive.yard_id,
        label: hive.label,
        hive_type: hive.hive_type,
        frames: hive.frames.toString(),
        status: hive.status,
        latitude: hive.latitude !== undefined ? hive.latitude.toString() : "",
        longitude: hive.longitude !== undefined ? hive.longitude.toString() : "",
        notes: hive.notes ?? "",
      });
    }
  }, [editModalVisible, hive]);

  if (!hive) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Hive not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Hive",
      `Are you sure you want to delete ${hive.label}? This will also delete all related data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("[HiveDetail] deleting hive", { hiveId: id });
            deleteHive(id);
            router.back();
          },
        },
      ],
    );
  };

  const handleUpdateHive = () => {
    console.log("[HiveDetail] updating hive", { hiveId: id, editForm });

    if (!editForm.label.trim()) {
      Alert.alert("Error", "Hive label is required");
      return;
    }

    if (!editForm.yard_id) {
      Alert.alert("Error", "Please select a yard");
      return;
    }

    const framesValue = Number.parseInt(editForm.frames, 10);
    if (Number.isNaN(framesValue) || framesValue <= 0) {
      Alert.alert("Error", "Please provide a valid number of frames");
      return;
    }

    const latitudeValue = parseCoordinate(editForm.latitude);
    const longitudeValue = parseCoordinate(editForm.longitude);

    if (latitudeValue === null || longitudeValue === null) {
      Alert.alert("Error", "Latitude and longitude must be valid numbers");
      return;
    }

    if ((latitudeValue === undefined) !== (longitudeValue === undefined)) {
      Alert.alert("Error", "Please provide both latitude and longitude or leave both empty.");
      return;
    }

    updateHive(id, {
      yard_id: editForm.yard_id,
      label: editForm.label.trim(),
      hive_type: editForm.hive_type.trim() || "Langstroth",
      frames: framesValue,
      status: editForm.status,
      latitude: latitudeValue,
      longitude: longitudeValue,
      notes: editForm.notes.trim() || undefined,
    });

    setEditModalVisible(false);
    Alert.alert("Success", "Hive updated successfully");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = () => {
    switch (hive.status) {
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

  const openInMaps = () => {
    if (!location) {
      Alert.alert("Location unavailable", "Add coordinates in the edit panel to enable navigation.");
      return;
    }

    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
      default: "https://www.google.com/maps/search/?api=1&query=",
    });
    const latLng = `${location.latitude},${location.longitude}`;
    const url = Platform.select({
      ios: `${scheme}${hive.label}@${latLng}`,
      android: `${scheme}${latLng}(${hive.label})`,
      default: `${scheme}${latLng}`,
    });

    console.log("[HiveDetail] open external maps", { hiveId: hive.id, latLng, source: location.source, url });
    Linking.openURL(url);
  };

  const renderOverview = () => {
    return (
      <View>
        {location ? (
          <View style={styles.mapContainer}>
            {Platform.OS === "web" ? (
              <TouchableOpacity
                style={styles.webMapFallback}
                onPress={openInMaps}
                activeOpacity={0.8}
                testID="hive-location-open-web"
              >
                <MapPin size={48} color={Colors.light.primary} />
                <Text style={styles.webMapText}>{hive.label}</Text>
                <Text style={styles.webMapCoords}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
                <View style={styles.locationChip}>
                  <MapPinned size={14} color={Colors.light.primary} />
                  <Text style={styles.locationChipText}>
                    {location.source === "hive" ? "Hive-specific" : "Yard location"}
                  </Text>
                </View>
                <View style={styles.webMapButton}>
                  <Text style={styles.webMapButtonText}>View on Google Maps</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <>
                <MapViewComponent
                  latitude={location.latitude}
                  longitude={location.longitude}
                  label={hive.label}
                  description={yard?.name ?? "Hive location"}
                />
                <TouchableOpacity
                  style={styles.mapOverlay}
                  onPress={openInMaps}
                  activeOpacity={0.85}
                  testID="hive-map-open-external"
                >
                  <MapPin size={18} color="#0F172A" />
                  <Text style={styles.mapOverlayText}>Open in Maps</Text>
                </TouchableOpacity>
                <View style={styles.locationBadge}>
                  <MapPinned size={14} color={Colors.light.primary} />
                  <Text style={styles.locationBadgeText}>
                    {location.source === "hive" ? "Hive precision" : "Using yard coordinates"}
                  </Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.locationEmptyState}>
            <MapPin size={38} color={Colors.light.tabIconDefault} />
            <Text style={styles.locationEmptyTitle}>No coordinates yet</Text>
            <Text style={styles.locationEmptySubtitle}>
              Add latitude and longitude to unlock navigation, map previews, and field routing.
            </Text>
            <TouchableOpacity
              style={styles.locationAction}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.85}
              testID="add-location-from-overview"
            >
              <Text style={styles.locationActionText}>Add location</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Yard</Text>
            <Text style={styles.infoValue}>{yard?.name || "Unknown"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{hive.hive_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frames</Text>
            <Text style={styles.infoValue}>{hive.frames}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + "20" }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>{hive.status}</Text>
            </View>
          </View>
          {location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Coordinates</Text>
              <TouchableOpacity onPress={openInMaps} activeOpacity={0.7}>
                <Text style={styles.infoLink}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hive.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Field Notes</Text>
            <Text style={styles.notesText}>{hive.notes}</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Calendar size={24} color={Colors.light.primary} />
            <Text style={styles.statValue}>{hiveInspections.length}</Text>
            <Text style={styles.statLabel}>Inspections</Text>
          </View>
          <View style={styles.statCard}>
            <CheckSquare size={24} color={Colors.light.primary} />
            <Text style={styles.statValue}>{hiveTasks.filter((t) => !t.is_done).length}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
        </View>

        {queen && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Queen</Text>
            <View style={styles.queenCard}>
              <Crown size={24} color={Colors.light.primary} />
              <View style={styles.queenInfo}>
                {queen.mark_color && (
                  <Text style={styles.queenText}>Mark: {queen.mark_color}</Text>
                )}
                {queen.hatch_date && (
                  <Text style={styles.queenText}>Hatched: {formatDate(queen.hatch_date)}</Text>
                )}
                {queen.origin && <Text style={styles.queenText}>Origin: {queen.origin}</Text>}
                {queen.temperament && (
                  <Text style={styles.queenText}>Temperament: {queen.temperament}/5</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderInspections = () => (
    <View>
      {hiveInspections.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyText}>No inspections yet</Text>
        </View>
      ) : (
        hiveInspections
          .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
          .map((inspection) => (
            <View key={inspection.id} style={styles.inspectionCard}>
              <View style={styles.inspectionHeader}>
                <Text style={styles.inspectionDate}>{formatDate(inspection.performed_at)}</Text>
              </View>
              <View style={styles.inspectionDetails}>
                {inspection.brood_pattern && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Brood: {inspection.brood_pattern}</Text>
                  </View>
                )}
                {inspection.eggs_seen !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Eggs: {inspection.eggs_seen ? "Yes" : "No"}</Text>
                  </View>
                )}
                {inspection.mites_per_100 !== undefined && (
                  <View
                    style={[
                      styles.badge,
                      inspection.mites_per_100 > 3 && styles.badgeWarning,
                    ]}
                  >
                    <Text style={styles.badgeText}>Mites: {inspection.mites_per_100}%</Text>
                  </View>
                )}
                {inspection.temper !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Temper: {inspection.temper}/5</Text>
                  </View>
                )}
              </View>
              {inspection.notes && (
                <Text style={styles.inspectionNotes}>{inspection.notes}</Text>
              )}
            </View>
          ))
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/inspection/new?hive=${id}` as const)}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Inspection</Text>
      </TouchableOpacity>
    </View>
  );

  const handleAddQueen = () => {
    if (!queenFormData.hatch_date && !queenFormData.origin) {
      Alert.alert("Error", "Please provide at least hatch date or origin");
      return;
    }

    addQueen({
      hive_id: id,
      hatch_date: queenFormData.hatch_date || undefined,
      origin: queenFormData.origin || undefined,
      mark_color: queenFormData.mark_color || undefined,
      temperament: queenFormData.temperament ? Number.parseInt(queenFormData.temperament, 10) : undefined,
      notes: queenFormData.notes || undefined,
      status: "Active",
    });

    setQueenFormData({ hatch_date: "", origin: "", mark_color: "", temperament: "", notes: "" });
    setQueenModalVisible(false);
    Alert.alert("Success", "Queen added successfully");
  };

  const handleSupersede = (queenId: string) => {
    Alert.alert(
      "Supersede Queen",
      "Mark this queen as superseded?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Supersede",
          onPress: () => {
            updateQueen(queenId, { status: "Superseded" });
            Alert.alert("Success", "Queen marked as superseded");
          },
        },
      ],
    );
  };

  const renderQueen = () => {
    const allQueens = queens.filter((q) => q.hive_id === id);
    return (
      <View>
        {allQueens.length === 0 ? (
          <View style={styles.emptyState}>
            <Crown size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyText}>No queen records</Text>
          </View>
        ) : (
          allQueens.map((q) => (
            <View key={q.id} style={styles.queenDetailCard}>
              <View style={styles.queenHeader}>
                <Crown size={24} color={Colors.light.primary} />
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          q.status === "Active"
                            ? Colors.light.success + "20"
                            : Colors.light.tabIconDefault + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            q.status === "Active" ? Colors.light.success : Colors.light.tabIconDefault,
                        },
                      ]}
                    >
                      {q.status}
                    </Text>
                  </View>
                  {q.status === "Active" && (
                    <TouchableOpacity onPress={() => handleSupersede(q.id)}>
                      <Text style={{ fontSize: 12, color: Colors.light.primary }}>Supersede</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {q.mark_color && (
                <Text style={styles.queenDetailText}>Mark Color: {q.mark_color}</Text>
              )}
              {q.hatch_date && (
                <Text style={styles.queenDetailText}>Hatch Date: {formatDate(q.hatch_date)}</Text>
              )}
              {q.origin && <Text style={styles.queenDetailText}>Origin: {q.origin}</Text>}
              {q.temperament && (
                <Text style={styles.queenDetailText}>Temperament: {q.temperament}/5</Text>
              )}
              {q.notes && <Text style={styles.queenNotes}>{q.notes}</Text>}
            </View>
          ))
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setQueenModalVisible(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Queen</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTasks = () => (
    <View>
      {hiveTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <CheckSquare size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyText}>No tasks for this hive</Text>
        </View>
      ) : (
        hiveTasks
          .sort((a, b) => {
            if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
            if (a.due_at && b.due_at) {
              return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
            }
            return 0;
          })
          .map((task) => (
            <View key={task.id} style={[styles.taskCard, task.is_done && styles.taskCardDone]}>
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, task.is_done && styles.taskTitleDone]}>
                  {task.title}
                </Text>
                <View
                  style={[
                    styles.priorityBadge,
                    task.priority === 1 && styles.priorityHigh,
                    task.priority === 2 && styles.priorityMedium,
                    task.priority === 3 && styles.priorityLow,
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {task.priority === 1 ? "High" : task.priority === 2 ? "Med" : "Low"}
                  </Text>
                </View>
              </View>
              {task.due_at && (
                <Text style={styles.taskDue}>Due: {formatDate(task.due_at)}</Text>
              )}
            </View>
          ))
      )}
    </View>
  );

  const handleAddTreatment = () => {
    if (!treatmentFormData.product.trim() || !treatmentFormData.start_date) {
      Alert.alert("Error", "Product name and start date are required");
      return;
    }

    addTreatment({
      hive_id: id,
      product: treatmentFormData.product,
      dose: treatmentFormData.dose || undefined,
      start_date: treatmentFormData.start_date,
      end_date: treatmentFormData.end_date || undefined,
      notes: treatmentFormData.notes || undefined,
    });

    setTreatmentFormData({ product: "", dose: "", start_date: "", end_date: "", notes: "" });
    setTreatmentModalVisible(false);
    Alert.alert("Success", "Treatment added successfully");
  };

  const handleDeleteTreatment = (treatmentId: string, product: string) => {
    Alert.alert(
      "Delete Treatment",
      `Remove ${product} treatment record?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTreatment(treatmentId);
            Alert.alert("Success", "Treatment deleted");
          },
        },
      ],
    );
  };

  const renderTreatments = () => (
    <View>
      {hiveTreatments.length === 0 ? (
        <View style={styles.emptyState}>
          <Pill size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyText}>No treatments recorded</Text>
        </View>
      ) : (
        hiveTreatments
          .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
          .map((treatment) => (
            <View key={treatment.id} style={styles.treatmentCard}>
              <View style={styles.treatmentHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.treatmentProduct}>{treatment.product}</Text>
                  {treatment.dose && (
                    <Text style={styles.treatmentDose}>Dose: {treatment.dose}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDeleteTreatment(treatment.id, treatment.product)}>
                  <Trash2 size={20} color={Colors.light.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.treatmentDates}>
                <Text style={styles.treatmentDate}>Start: {formatDate(treatment.start_date)}</Text>
                {treatment.end_date && (
                  <Text style={styles.treatmentDate}>End: {formatDate(treatment.end_date)}</Text>
                )}
              </View>
              {treatment.notes && (
                <Text style={styles.treatmentNotes}>{treatment.notes}</Text>
              )}
            </View>
          ))
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setTreatmentModalVisible(true)}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Treatment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Hexagon size={32} color={Colors.light.primary} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{hive.label}</Text>
          <Text style={styles.subtitle}>{yard?.name || "Unknown Yard"}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setEditModalVisible(true)}
          testID="edit-hive-button"
        >
          <Edit size={20} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleDelete}
          testID="delete-hive-button"
        >
          <Trash2 size={20} color={Colors.light.error} />
          <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {(["overview", "inspections", "queen", "tasks"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            testID={`hive-tab-${tab}`}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "inspections" && renderInspections()}
        {activeTab === "queen" && renderQueen()}
        {activeTab === "tasks" && renderTasks()}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Hive</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Label *</Text>
              <TextInput
                style={styles.input}
                value={editForm.label}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, label: text }))}
                placeholder="Hive label"
                placeholderTextColor={Colors.light.tabIconDefault}
                testID="edit-hive-label"
              />

              <Text style={styles.label}>Yard *</Text>
              <View style={styles.pickerGroup}>
                {yards.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.pill, editForm.yard_id === item.id && styles.pillActive]}
                    onPress={() => setEditForm((prev) => ({ ...prev, yard_id: item.id }))}
                    testID={`edit-hive-yard-${item.id}`}
                  >
                    <Text style={[styles.pillText, editForm.yard_id === item.id && styles.pillTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Hive Type</Text>
              <TextInput
                style={styles.input}
                value={editForm.hive_type}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, hive_type: text }))}
                placeholder="Langstroth"
                placeholderTextColor={Colors.light.tabIconDefault}
                testID="edit-hive-type"
              />

              <Text style={styles.label}>Number of Frames</Text>
              <TextInput
                style={styles.input}
                value={editForm.frames}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, frames: text }))}
                placeholder="10"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="number-pad"
                testID="edit-hive-frames"
              />

              <Text style={styles.label}>Status</Text>
              <View style={styles.statusGroup}>
                {STATUS_OPTIONS.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusChip, editForm.status === status && styles.statusChipActive]}
                    onPress={() => setEditForm((prev) => ({ ...prev, status }))}
                    testID={`edit-hive-status-${status}`}
                  >
                    <Text
                      style={[styles.statusChipText, editForm.status === status && styles.statusChipTextActive]}
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
                testID="open-map-picker-edit"
              >
                <Navigation size={20} color={Colors.light.primary} />
                <View style={styles.mapPickerContent}>
                  {editForm.latitude && editForm.longitude ? (
                    <>
                      <Text style={styles.mapPickerTextPrimary}>Location Set</Text>
                      <Text style={styles.mapPickerTextSecondary}>
                        {parseFloat(editForm.latitude).toFixed(4)}, {parseFloat(editForm.longitude).toFixed(4)}
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
                style={[styles.input, styles.textArea]}
                value={editForm.notes}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, notes: text }))}
                placeholder="Microclimate, access info, seasonal reminders..."
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                testID="edit-hive-notes"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setEditModalVisible(false)}
                testID="cancel-hive-edit"
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleUpdateHive}
                testID="confirm-hive-edit"
              >
                <Text style={styles.buttonPrimaryText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={queenModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQueenModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Queen</Text>
              <TouchableOpacity onPress={() => setQueenModalVisible(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Hatch Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={queenFormData.hatch_date}
                onChangeText={(text) => setQueenFormData((prev) => ({ ...prev, hatch_date: text }))}
                placeholder="e.g., 2024-04-15"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Origin</Text>
              <TextInput
                style={styles.input}
                value={queenFormData.origin}
                onChangeText={(text) => setQueenFormData((prev) => ({ ...prev, origin: text }))}
                placeholder="e.g., Local Breeder"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Mark Color</Text>
              <View style={styles.colorGroup}>
                {["White", "Yellow", "Red", "Green", "Blue"].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorButton, queenFormData.mark_color === color && styles.colorButtonActive]}
                    onPress={() => setQueenFormData((prev) => ({ ...prev, mark_color: color }))}
                  >
                    <Text
                      style={[styles.colorButtonText, queenFormData.mark_color === color && styles.colorButtonTextActive]}
                    >
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Temperament (1-5)</Text>
              <View style={styles.ratingGroup}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[styles.ratingButton, queenFormData.temperament === rating.toString() && styles.ratingButtonActive]}
                    onPress={() => setQueenFormData((prev) => ({ ...prev, temperament: rating.toString() }))}
                  >
                    <Text
                      style={[styles.ratingButtonText, queenFormData.temperament === rating.toString() && styles.ratingButtonTextActive]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={queenFormData.notes}
                onChangeText={(text) => setQueenFormData((prev) => ({ ...prev, notes: text }))}
                placeholder="Additional notes..."
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setQueenModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleAddQueen}>
                <Text style={styles.buttonPrimaryText}>Add Queen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={treatmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTreatmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Treatment</Text>
              <TouchableOpacity onPress={() => setTreatmentModalVisible(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={treatmentFormData.product}
                onChangeText={(text) => setTreatmentFormData((prev) => ({ ...prev, product: text }))}
                placeholder="e.g., Apivar"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Dose</Text>
              <TextInput
                style={styles.input}
                value={treatmentFormData.dose}
                onChangeText={(text) => setTreatmentFormData((prev) => ({ ...prev, dose: text }))}
                placeholder="e.g., 2 strips"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={treatmentFormData.start_date}
                onChangeText={(text) => setTreatmentFormData((prev) => ({ ...prev, start_date: text }))}
                placeholder="e.g., 2025-01-15"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={treatmentFormData.end_date}
                onChangeText={(text) => setTreatmentFormData((prev) => ({ ...prev, end_date: text }))}
                placeholder="e.g., 2025-02-15"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={treatmentFormData.notes}
                onChangeText={(text) => setTreatmentFormData((prev) => ({ ...prev, notes: text }))}
                placeholder="Additional notes..."
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setTreatmentModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleAddTreatment}>
                <Text style={styles.buttonPrimaryText}>Add Treatment</Text>
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
          initialLatitude={editForm.latitude ? parseFloat(editForm.latitude) : undefined}
          initialLongitude={editForm.longitude ? parseFloat(editForm.longitude) : undefined}
          onConfirm={(latitude: number, longitude: number) => {
            console.log("[HiveDetail] location confirmed", { latitude, longitude });
            setEditForm((prev) => ({
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.card,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 12,
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
  actionButtonDanger: {
    backgroundColor: Colors.light.error + "10",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.primary,
  },
  actionButtonTextDanger: {
    color: Colors.light.error,
  },
  tabs: {
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxHeight: 50,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.tabIconDefault,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: "600" as const,
  },
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    padding: 16,
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
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
  mapOverlay: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FACC15",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: "rgba(15, 23, 42, 0.24)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
    }),
  },
  mapOverlayText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  locationBadge: {
    position: "absolute",
    left: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.card + "E6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.tabIconDefault,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
  },
  webMapText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  webMapCoords: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.tabIconDefault,
  },
  webMapButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  webMapButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  locationEmptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  locationEmptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  locationEmptySubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
  },
  locationAction: {
    marginTop: 4,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  locationActionText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  infoLink: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.primary,
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
  notesCard: {
    backgroundColor: Colors.light.card,
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  notesText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  queenCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
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
  queenInfo: {
    flex: 1,
  },
  queenText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  inspectionCard: {
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
  inspectionHeader: {
    marginBottom: 12,
  },
  inspectionDate: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  inspectionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeWarning: {
    backgroundColor: Colors.light.warning + "20",
  },
  badgeText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  inspectionNotes: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  queenDetailCard: {
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
  queenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  queenDetailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  queenNotes: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
    fontStyle: "italic",
  },
  taskCard: {
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
  taskCardDone: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
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
  taskDue: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: "center",
    marginTop: 32,
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
  pickerGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.tabIconDefault,
  },
  pillTextActive: {
    color: "#1F2937",
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
    height: 110,
    textAlignVertical: "top",
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
  colorGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  colorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  colorButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  colorButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  colorButtonTextActive: {
    color: "#FFFFFF",
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
    backgroundColor: Colors.light.background,
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
  treatmentCard: {
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
  treatmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  treatmentProduct: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  treatmentDose: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  treatmentDates: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  treatmentDate: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  treatmentNotes: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontStyle: "italic",
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
