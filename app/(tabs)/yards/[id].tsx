import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Modal, TextInput, Alert, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Hexagon, Plus, MapPin, Edit, Trash2, Navigation } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMindStore } from "@/store/beemind-store";



export default function YardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { yards, hives, updateYard, deleteYard, addHive } = useBeeMindStore();
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [hiveModalVisible, setHiveModalVisible] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    elevation_m: "",
    notes: "",
  });
  const [hiveFormData, setHiveFormData] = useState({
    label: "",
    hive_type: "Langstroth",
    frames: "10",
  });

  const yard = yards.find((y) => y.id === id);
  const yardHives = hives.filter((h) => h.yard_id === id);

  if (!yard) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Yard not found</Text>
      </View>
    );
  }

  const handleEdit = () => {
    setEditFormData({
      name: yard.name,
      address: yard.address || "",
      latitude: yard.latitude?.toString() || "",
      longitude: yard.longitude?.toString() || "",
      elevation_m: yard.elevation_m?.toString() || "",
      notes: yard.notes || "",
    });
    setEditModalVisible(true);
  };

  const handleUpdateYard = () => {
    if (!editFormData.name.trim()) {
      Alert.alert("Error", "Yard name is required");
      return;
    }

    updateYard(id, {
      name: editFormData.name,
      address: editFormData.address || undefined,
      latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : undefined,
      longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : undefined,
      elevation_m: editFormData.elevation_m ? parseFloat(editFormData.elevation_m) : undefined,
      notes: editFormData.notes || undefined,
    });

    setEditModalVisible(false);
    Alert.alert("Success", "Yard updated successfully");
  };

  const handleDeleteYard = () => {
    Alert.alert(
      "Delete Yard",
      `Are you sure you want to delete ${yard.name}? This will also delete all hives in this yard.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteYard(id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddHive = () => {
    if (!hiveFormData.label.trim()) {
      Alert.alert("Error", "Hive label is required");
      return;
    }

    addHive({
      yard_id: id,
      label: hiveFormData.label,
      hive_type: hiveFormData.hive_type,
      frames: parseInt(hiveFormData.frames) || 10,
      status: "Active",
    });

    setHiveFormData({ label: "", hive_type: "Langstroth", frames: "10" });
    setHiveModalVisible(false);
    Alert.alert("Success", "Hive created successfully");
  };

  const openInMaps = () => {
    if (!yard.latitude || !yard.longitude) return;
    
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
      default: "https://www.google.com/maps/search/?api=1&query=",
    });
    const latLng = `${yard.latitude},${yard.longitude}`;
    const url = Platform.select({
      ios: `${scheme}${yard.name}@${latLng}`,
      android: `${scheme}${latLng}(${yard.name})`,
      default: `${scheme}${latLng}`,
    });
    Linking.openURL(url);
  };

  const hasLocation = yard.latitude && yard.longitude;

  const renderMap = () => {
    if (!hasLocation) return null;

    if (Platform.OS === "web") {
      return (
        <View style={styles.mapContainer}>
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: 12 }}
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyC3RmPJI5SBF_CqWtGnKrNSFJMJL1KQGjM&q=${yard.latitude},${yard.longitude}&zoom=15`}
            allowFullScreen
          />
          <TouchableOpacity style={styles.mapOverlayButton} onPress={openInMaps}>
            <Navigation size={16} color="#FFFFFF" />
            <Text style={styles.mapOverlayButtonText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const maps = require("react-native-maps");
    const MapView = maps.default;
    const Marker = maps.Marker;
    const PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: yard.latitude ?? 0,
            longitude: yard.longitude ?? 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: yard.latitude ?? 0,
              longitude: yard.longitude ?? 0,
            }}
            title={yard.name}
            description={yard.address}
          />
        </MapView>
        <TouchableOpacity style={styles.mapOverlayButton} onPress={openInMaps}>
          <Navigation size={16} color="#FFFFFF" />
          <Text style={styles.mapOverlayButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MapPin size={32} color={Colors.light.primary} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{yard.name}</Text>
            {yard.address && <Text style={styles.subtitle}>{yard.address}</Text>}
          </View>
        </View>

        {renderMap()}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hives</Text>
            <Text style={styles.infoValue}>{yardHives.length}</Text>
          </View>
          {yard.elevation_m && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Elevation</Text>
              <Text style={styles.infoValue}>{yard.elevation_m}m</Text>
            </View>
          )}
          {hasLocation && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Coordinates</Text>
              <Text style={styles.infoValue}>
                {yard.latitude?.toFixed(4)}, {yard.longitude?.toFixed(4)}
              </Text>
            </View>
          )}
          {yard.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{yard.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Edit size={20} color={Colors.light.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={handleDeleteYard}>
            <Trash2 size={20} color={Colors.light.error} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hives</Text>
            <TouchableOpacity onPress={() => setHiveModalVisible(true)}>
              <Plus size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          {yardHives.length === 0 ? (
            <View style={styles.emptyState}>
              <Hexagon size={48} color={Colors.light.tabIconDefault} />
              <Text style={styles.emptyText}>No hives in this yard yet</Text>
            </View>
          ) : (
            yardHives.map((hive) => (
              <TouchableOpacity
                key={hive.id}
                style={styles.hiveCard}
                onPress={() => router.push(`/(tabs)/hives/${hive.id}` as any)}
              >
                <View style={styles.hiveIcon}>
                  <Hexagon size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.hiveContent}>
                  <Text style={styles.hiveLabel}>{hive.label}</Text>
                  <Text style={styles.hiveDetails}>
                    {hive.hive_type} • {hive.frames} frames
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    hive.status === "Active" && styles.statusActive,
                    hive.status === "Split" && styles.statusSplit,
                    hive.status === "Deadout" && styles.statusDeadout,
                  ]}
                >
                  <Text style={styles.statusText}>{hive.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
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
              <Text style={styles.modalTitle}>Edit Yard</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={editFormData.name}
                onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                placeholder="Yard name"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={editFormData.address}
                onChangeText={(text) => setEditFormData({ ...editFormData, address: text })}
                placeholder="Address"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={editFormData.latitude}
                onChangeText={(text) => setEditFormData({ ...editFormData, latitude: text })}
                placeholder="e.g., 40.7128"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={editFormData.longitude}
                onChangeText={(text) => setEditFormData({ ...editFormData, longitude: text })}
                placeholder="e.g., -74.0060"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Elevation (meters)</Text>
              <TextInput
                style={styles.input}
                value={editFormData.elevation_m}
                onChangeText={(text) => setEditFormData({ ...editFormData, elevation_m: text })}
                placeholder="Elevation"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editFormData.notes}
                onChangeText={(text) => setEditFormData({ ...editFormData, notes: text })}
                placeholder="Notes"
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleUpdateYard}>
                <Text style={styles.buttonPrimaryText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={hiveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Hive</Text>
              <TouchableOpacity onPress={() => setHiveModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Label *</Text>
              <TextInput
                style={styles.input}
                value={hiveFormData.label}
                onChangeText={(text) => setHiveFormData({ ...hiveFormData, label: text })}
                placeholder="e.g., Hive 1"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Hive Type</Text>
              <TextInput
                style={styles.input}
                value={hiveFormData.hive_type}
                onChangeText={(text) => setHiveFormData({ ...hiveFormData, hive_type: text })}
                placeholder="e.g., Langstroth"
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>Number of Frames</Text>
              <TextInput
                style={styles.input}
                value={hiveFormData.frames}
                onChangeText={(text) => setHiveFormData({ ...hiveFormData, frames: text })}
                placeholder="e.g., 10"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setHiveModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleAddHive}>
                <Text style={styles.buttonPrimaryText}>Create Hive</Text>
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
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.card,
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
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
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
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlayButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mapOverlayButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
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
    flex: 1,
    textAlign: "right",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  hiveCard: {
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
  hiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  hiveContent: {
    flex: 1,
  },
  hiveLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  hiveDetails: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: Colors.light.success + "20",
  },
  statusSplit: {
    backgroundColor: Colors.light.warning + "20",
  },
  statusDeadout: {
    backgroundColor: Colors.light.error + "20",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
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
  closeButton: {
    fontSize: 24,
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
