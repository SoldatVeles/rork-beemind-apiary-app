import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapViewComponentProps {
  latitude: number;
  longitude: number;
  label: string;
  description: string;
}

export default function MapViewComponent({ latitude, longitude, label, description }: MapViewComponentProps) {
  return (
    <MapView
      style={styles.map}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        title={label}
        description={description}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
