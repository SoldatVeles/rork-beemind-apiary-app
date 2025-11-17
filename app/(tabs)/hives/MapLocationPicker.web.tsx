import React, { useCallback, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Check, X, Navigation } from "lucide-react-native";
import Colors from "../../../constants/colors";

interface MapLocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (latitude: number, longitude: number) => void;
  onCancel: () => void;
}

export default function MapLocationPicker({
  initialLatitude,
  initialLongitude,
  onConfirm,
  onCancel,
}: MapLocationPickerProps) {
  const [latitude, setLatitude] = useState<string>(
    initialLatitude !== undefined ? initialLatitude.toString() : ""
  );
  const [longitude, setLongitude] = useState<string>(
    initialLongitude !== undefined ? initialLongitude.toString() : ""
  );
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);

  const handleGetCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[MapLocationPicker Web] Got current location", position.coords);
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("[MapLocationPicker Web] Error getting location", error);
          Alert.alert(
            "Location Error",
            "Unable to get your current location. Please enter coordinates manually."
          );
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      Alert.alert(
        "Not Supported",
        "Geolocation is not supported by your browser. Please enter coordinates manually."
      );
      setIsGettingLocation(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Invalid Coordinates", "Please enter valid latitude and longitude values.");
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert("Invalid Latitude", "Latitude must be between -90 and 90.");
      return;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert("Invalid Longitude", "Longitude must be between -180 and 180.");
      return;
    }

    console.log("[MapLocationPicker Web] Confirming location", { lat, lng });
    onConfirm(lat, lng);
  }, [latitude, longitude, onConfirm]);

  const insets = useSafeAreaInsets();

  const isValid = latitude.trim() !== "" && longitude.trim() !== "";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MapPin size={24} color={Colors.light.primary} />
          <Text style={styles.headerTitle}>Set Location</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Enter coordinates or use your current location
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="e.g., 40.7128"
            keyboardType="numeric"
            testID="latitude-input"
          />
          <Text style={styles.hint}>Range: -90 to 90</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="e.g., -74.0060"
            keyboardType="numeric"
            testID="longitude-input"
          />
          <Text style={styles.hint}>Range: -180 to 180</Text>
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleGetCurrentLocation}
          disabled={isGettingLocation}
          testID="get-current-location"
        >
          <Navigation size={20} color={Colors.light.primary} />
          <Text style={styles.locationButtonText}>
            {isGettingLocation ? "Getting location..." : "Use Current Location"}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tip: You can also find coordinates by searching for your location on Google Maps
            and copying the coordinates from the URL or info panel.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onCancel}
          testID="cancel-location-picker"
        >
          <X size={20} color={Colors.light.text} />
          <Text style={styles.buttonSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, !isValid && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={!isValid}
          testID="confirm-location-picker"
        >
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.buttonPrimaryText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  inputSection: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  hint: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + "12",
    borderWidth: 1,
    borderColor: Colors.light.primary + "30",
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonDisabled: {
    opacity: 0.5,
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
