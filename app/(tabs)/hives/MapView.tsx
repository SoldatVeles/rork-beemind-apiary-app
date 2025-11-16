import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Compass, MapPin } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../../constants/colors";

interface MapViewComponentProps {
  latitude: number;
  longitude: number;
  label: string;
  description: string;
}

export default function MapViewComponent({ latitude, longitude, label, description }: MapViewComponentProps) {
  const insets = useSafeAreaInsets();
  const formattedCoordinates = useMemo(() => ({
    lat: latitude.toFixed(4),
    lng: longitude.toFixed(4),
  }), [latitude, longitude]);

  return (
    <View style={styles.wrapper} testID="map-preview">
      <LinearGradient
        colors={[Colors.light.secondary + "33", Colors.light.primary + "4D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: 18 + insets.top * 0.15 }]}
      >
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <MapPin size={16} color={Colors.light.text} />
          </View>
          <Text style={styles.title}>{label}</Text>
        </View>
        <Text style={styles.subtitle}>{description}</Text>
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
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  gradient: {
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.secondary + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  coordinate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coordinateText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.light.border,
  },
});
