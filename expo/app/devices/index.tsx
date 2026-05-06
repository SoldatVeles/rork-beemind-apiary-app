import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Modal, TextInput, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Activity, Plus, X, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import type { DeviceType } from "@/types";

export default function DevicesScreen() {
  const router = useRouter();
  const { devices, hives, addDevice, deleteDevice, sensorReadings } = useBeeMind();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    device_type: "temp" as DeviceType,
    hive_id: "",
    name: "",
    firmware: "",
  });

  const getHiveLabel = (hiveId?: string) => {
    if (!hiveId) return "Unassigned";
    return hives.find((h) => h.id === hiveId)?.label || "Unknown Hive";
  };

  const getDeviceIcon = (type: DeviceType) => {
    return <Activity size={24} color={Colors.light.primary} />;
  };

  const getReadingsCount = (deviceId: string) => {
    return sensorReadings.filter((r) => r.device_id === deviceId).length;
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Device name is required");
      return;
    }

    addDevice({
      device_type: formData.device_type,
      hive_id: formData.hive_id || undefined,
      name: formData.name,
      firmware: formData.firmware || undefined,
    });

    setFormData({ device_type: "temp", hive_id: "", name: "", firmware: "" });
    setModalVisible(false);
    Alert.alert("Success", "Device added successfully");
  };

  const handleDelete = (deviceId: string, deviceName: string) => {
    Alert.alert(
      "Delete Device",
      `Are you sure you want to delete ${deviceName}? This will also delete all sensor readings.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteDevice(deviceId);
            Alert.alert("Success", "Device deleted successfully");
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Devices & Sensors" }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Activity size={64} color={Colors.light.tabIconDefault} />
              <Text style={styles.emptyTitle}>No Devices</Text>
              <Text style={styles.emptyText}>Add your first sensor device</Text>
            </View>
          ) : (
            devices.map((device) => (
              <View key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceIcon}>{getDeviceIcon(device.device_type)}</View>
                  <View style={styles.deviceContent}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceType}>
                      {device.device_type.charAt(0).toUpperCase() + device.device_type.slice(1)}
                    </Text>
                    <Text style={styles.deviceHive}>{getHiveLabel(device.hive_id)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(device.id, device.name)}
                  >
                    <Trash2 size={20} color={Colors.light.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.deviceStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{getReadingsCount(device.id)}</Text>
                    <Text style={styles.statLabel}>Readings</Text>
                  </View>
                  {device.firmware && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{device.firmware}</Text>
                      <Text style={styles.statLabel}>Firmware</Text>
                    </View>
                  )}
                </View>
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
                <Text style={styles.modalTitle}>New Device</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form}>
                <Text style={styles.label}>Device Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Hive Scale 1"
                  placeholderTextColor={Colors.light.tabIconDefault}
                />

                <Text style={styles.label}>Device Type</Text>
                <View style={styles.typeGroup}>
                  {(["scale", "temp", "humidity", "co2", "mic"] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.device_type === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, device_type: type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.device_type === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Assign to Hive (optional)</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      formData.hive_id === "" && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, hive_id: "" })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.hive_id === "" && styles.pickerOptionTextSelected,
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TouchableOpacity>
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

                <Text style={styles.label}>Firmware Version</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firmware}
                  onChangeText={(text) => setFormData({ ...formData, firmware: text })}
                  placeholder="e.g., v1.2.3"
                  placeholderTextColor={Colors.light.tabIconDefault}
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
                  <Text style={styles.buttonPrimaryText}>Add Device</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  deviceCard: {
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
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 2,
  },
  deviceHive: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  deleteButton: {
    padding: 8,
  },
  deviceStats: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
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
  typeGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
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
