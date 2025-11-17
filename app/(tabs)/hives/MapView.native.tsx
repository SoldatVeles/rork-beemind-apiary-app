import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Compass, MapPin } from "lucide-react-native";
import Colors from "../../../constants/colors";

interface MapViewComponentProps {
  latitude: number;
  longitude: number;
  label: string;
  description: string;
}

export default function MapViewComponent({ latitude, longitude, label, description }: MapViewComponentProps) {
  const insets = useSafeAreaInsets();
  const region = useMemo<Region>(() => ({
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [latitude, longitude]);

  const formattedCoordinates = useMemo(() => ({
    lat: latitude.toFixed(4),
    lng: longitude.toFixed(4),
  }), [latitude, longitude]);

  const provider = Platform.select({ ios: PROVIDER_GOOGLE, android: PROVIDER_GOOGLE, default: PROVIDER_DEFAULT });

  return (
    <View style={styles.wrapper} testID="map-preview">
      <MapView
        style={styles.map}
        provider={provider}
        initialRegion={region}
        region={region}
        zoomControlEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        loadingEnabled
        loadingIndicatorColor={Colors.light.primary}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={label}
          description={description}
          identifier="hive-location"
        />
      </MapView>
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
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: "rgba(15, 23, 42, 0.22)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
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
});
