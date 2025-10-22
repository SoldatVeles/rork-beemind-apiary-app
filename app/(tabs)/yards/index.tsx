import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Modal, TextInput, Alert, Linking } from "react-native";
import { MapPin, Plus, X, Map as MapIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useBeeMindStore } from "@/store/beemind-store";
import { useLanguage } from "@/store/language-store";



export default function YardsScreen() {
  const router = useRouter();
  const { yards, hives, addYard } = useBeeMindStore();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    elevation_m: "",
    notes: "",
  });

  const getHiveCount = (yardId: string) => {
    return hives.filter((h) => h.yard_id === yardId).length;
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert(t.common.error, t.yards.nameRequired);
      return;
    }

    addYard({
      name: formData.name,
      address: formData.address || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      elevation_m: formData.elevation_m ? parseFloat(formData.elevation_m) : undefined,
      notes: formData.notes || undefined,
    });

    setFormData({ name: "", address: "", latitude: "", longitude: "", elevation_m: "", notes: "" });
    setModalVisible(false);
    Alert.alert(t.common.success, t.yards.created);
  };

  const yardsWithLocation = yards.filter((y) => y.latitude && y.longitude);
  const hasYardsWithLocation = yardsWithLocation.length > 0;

  const openInMaps = (latitude: number, longitude: number, label: string) => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
      default: "https://www.google.com/maps/search/?api=1&query=",
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      default: `${scheme}${latLng}`,
    });
    Linking.openURL(url);
  };

  const renderMapView = () => {
    const centerLat = yardsWithLocation.reduce((sum, y) => sum + (y.latitude || 0), 0) / yardsWithLocation.length;
    const centerLng = yardsWithLocation.reduce((sum, y) => sum + (y.longitude || 0), 0) / yardsWithLocation.length;

    if (Platform.OS === "web") {
      return (
        <View style={styles.webMapContainer}>
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: 12 }}
            src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyC3RmPJI5SBF_CqWtGnKrNSFJMJL1KQGjM&center=${centerLat},${centerLng}&zoom=12&maptype=roadmap`}
            allowFullScreen
          />
          {yardsWithLocation.map((yard) => (
            <TouchableOpacity
              key={yard.id}
              style={styles.webMarkerLink}
              onPress={() => openInMaps(yard.latitude!, yard.longitude!, yard.name)}
            >
              <Text style={styles.webMarkerText}>{yard.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {hasYardsWithLocation && (
          <TouchableOpacity
            style={styles.mapPreviewCard}
            onPress={() => setMapModalVisible(true)}
          >
            <View style={styles.mapPreviewHeader}>
              <MapIcon size={20} color={Colors.light.primary} />
              <Text style={styles.mapPreviewTitle}>{t.yards.viewMap || "View All Yards on Map"}</Text>
            </View>
            <Text style={styles.mapPreviewSubtitle}>
              {yardsWithLocation.length} {yardsWithLocation.length === 1 ? "yard" : "yards"} with location
            </Text>
          </TouchableOpacity>
        )}

        {yards.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>{t.yards.noYards}</Text>
            <Text style={styles.emptyText}>{t.yards.addFirst}</Text>
          </View>
        ) : (
          yards.map((yard) => (
            <TouchableOpacity
              key={yard.id}
              style={styles.yardCard}
              onPress={() => router.push(`/(tabs)/yards/${yard.id}` as any)}
            >
              <View style={styles.yardIcon}>
                <MapPin size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.yardContent}>
                <Text style={styles.yardName}>{yard.name}</Text>
                {yard.address && <Text style={styles.yardAddress}>{yard.address}</Text>}
                <View style={styles.yardStats}>
                  <Text style={styles.yardStat}>{getHiveCount(yard.id)} {t.yards.hives}</Text>
                  {yard.elevation_m && (
                    <Text style={styles.yardStat}>{yard.elevation_m}{t.yards.elevationM}</Text>
                  )}
                  {yard.latitude && yard.longitude && (
                    <Text style={styles.yardStat}>📍 {t.yards.hasLocation || "Has location"}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
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
            <Text style={styles.mapModalTitle}>{t.yards.allYards || "All Yards"}</Text>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          {renderMapView()}
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
              <Text style={styles.modalTitle}>{t.yards.newYard}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>{t.yards.name} *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t.yards.namePlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>{t.yards.address}</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder={t.yards.addressPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>{t.yards.latitude || "Latitude"}</Text>
              <TextInput
                style={styles.input}
                value={formData.latitude}
                onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                placeholder="e.g., 40.7128"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>{t.yards.longitude || "Longitude"}</Text>
              <TextInput
                style={styles.input}
                value={formData.longitude}
                onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                placeholder="e.g., -74.0060"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>{t.yards.elevation}</Text>
              <TextInput
                style={styles.input}
                value={formData.elevation_m}
                onChangeText={(text) => setFormData({ ...formData, elevation_m: text })}
                placeholder={t.yards.elevationPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>{t.yards.notes}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder={t.yards.notesPlaceholder}
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
                <Text style={styles.buttonSecondaryText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleSubmit}>
                <Text style={styles.buttonPrimaryText}>{t.yards.createYard}</Text>
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
  mapPreviewCard: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  yardCard: {
    flexDirection: "row",
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
  yardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  yardContent: {
    flex: 1,
  },
  yardName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  yardAddress: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  yardStats: {
    flexDirection: "row",
    gap: 16,
  },
  yardStat: {
    fontSize: 12,
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
  map: {
    flex: 1,
  },
  webMapContainer: {
    flex: 1,
    position: "relative",
  },
  webMarkerLink: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
  },
  webMarkerText: {
    color: "#FFFFFF",
    fontWeight: "600" as const,
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
