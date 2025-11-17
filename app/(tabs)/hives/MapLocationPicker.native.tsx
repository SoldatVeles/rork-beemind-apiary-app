import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Check, X } from "lucide-react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import Colors from "../../../constants/colors";

const PROVIDER_DEFAULT = "default" as const;

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
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(
    initialLatitude !== undefined && initialLongitude !== undefined
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null
  );

  const mapRef = useRef<MapView>(null);

  const initialRegion = useMemo<Region>(() => {
    const lat = initialLatitude ?? 40.7128;
    const lng = initialLongitude ?? -74.006;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [initialLatitude, initialLongitude]);

  const handleMapPress = useCallback((event: any) => {
    const { coordinate } = event.nativeEvent;
    console.log("[MapLocationPicker] map pressed", coordinate);
    setSelectedCoordinate(coordinate);
  }, []);

  const handleMarkerDrag = useCallback((event: any) => {
    const { coordinate } = event.nativeEvent;
    console.log("[MapLocationPicker] marker dragged", coordinate);
    setSelectedCoordinate(coordinate);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedCoordinate) {
      Alert.alert("No Location Selected", "Please tap on the map to select a location.");
      return;
    }

    console.log("[MapLocationPicker] confirming location", selectedCoordinate);
    onConfirm(selectedCoordinate.latitude, selectedCoordinate.longitude);
  }, [selectedCoordinate, onConfirm]);

  const insets = useSafeAreaInsets();

  const provider = Platform.select({
    ios: PROVIDER_GOOGLE,
    android: PROVIDER_GOOGLE,
    default: PROVIDER_DEFAULT,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MapPin size={24} color={Colors.light.primary} />
          <Text style={styles.headerTitle}>Select Location</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Tap on the map or drag the pin to set the hive location
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={provider}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          zoomControlEnabled
          scrollEnabled
          pitchEnabled={false}
          rotateEnabled
          loadingEnabled
          loadingIndicatorColor={Colors.light.primary}
          testID="map-location-picker"
        >
          {selectedCoordinate && (
            <Marker
              coordinate={selectedCoordinate}
              draggable
              onDragEnd={handleMarkerDrag}
              title="Hive Location"
              description="Drag to adjust"
              identifier="selected-location"
              testID="location-marker"
            />
          )}
        </MapView>
      </View>

      {selectedCoordinate && (
        <View style={styles.coordinates}>
          <Text style={styles.coordinatesLabel}>Selected Location</Text>
          <Text style={styles.coordinatesValue}>
            {selectedCoordinate.latitude.toFixed(6)}, {selectedCoordinate.longitude.toFixed(6)}
          </Text>
        </View>
      )}

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
          style={[styles.button, styles.buttonPrimary, !selectedCoordinate && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedCoordinate}
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  coordinates: {
    padding: 16,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  coordinatesLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coordinatesValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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
