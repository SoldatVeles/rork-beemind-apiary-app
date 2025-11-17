import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, Compass, MapPin } from "lucide-react-native";
import Colors from "../../constants/colors";

interface MapViewComponentProps {
  latitude: number;
  longitude: number;
  label: string;
  description: string;
}

export default function MapViewComponent({ latitude, longitude, label, description }: MapViewComponentProps) {
  const insets = useSafeAreaInsets();
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const region = useMemo<Region>(() => ({
    latitude,
    longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  }), [latitude, longitude]);

  const formattedCoordinates = useMemo(() => ({
    lat: latitude.toFixed(4),
    lng: longitude.toFixed(4),
  }), [latitude, longitude]);

  return (
    <View style={styles.wrapper} testID="map-preview-web">
      {!hasError ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          zoomControlEnabled
          scrollEnabled
          pitchEnabled
          rotateEnabled
          onMapReady={() => setIsLoading(false)}
          onError={(event) => {
            console.log("[HiveMapWeb] Map failed to load", event.nativeEvent);
            setIsLoading(false);
            setHasError(true);
          }}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={label}
            description={description}
            identifier="hive-location-web"
          />
        </MapView>
      ) : (
        <View style={styles.errorState}>
          <AlertTriangle size={28} color={Colors.light.error} />
          <Text style={styles.errorTitle}>Map unavailable</Text>
          <Text style={styles.errorText}>Check your connection or open the hive in your preferred maps app.</Text>
        </View>
      )}
      {isLoading && !hasError ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading map tiles…</Text>
        </View>
      ) : null}
      <LinearGradient
        colors={[Colors.light.card + "F2", Colors.light.card + "CC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.brief, { paddingBottom: 16 + insets.bottom * 0.4 }]}
      >
        <View style={styles.briefHeader}>
          <View style={styles.iconBadge}>
            <MapPin size={18} color={Colors.light.primary} />
          </View>
          <Text style={styles.title} numberOfLines={1}>{label}</Text>
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>{description}</Text>
        <View style={styles.footer}>
          <View style={styles.coordinate}>
            <Compass size={14} color={Colors.light.secondary} />
            <Text style={styles.coordinateText}>Lat {formattedCoordinates.lat}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.coordinate}>
            <Compass size={14} color={Colors.light.secondary} />
            <Text style={styles.coordinateText}>Lng {formattedCoordinates.lng}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  brief: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Platform.select({
      web: {
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.32)",
      },
      default: {},
    }),
  },
  briefHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coordinate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coordinateText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: Colors.light.border,
  },
  loadingOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.card + "E6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.tabIconDefault,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.background,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.error,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 18,
  },
});
