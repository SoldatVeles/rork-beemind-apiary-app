import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MapViewComponentProps {
  latitude: number;
  longitude: number;
  label: string;
  description: string;
}

export default function MapViewComponent({ latitude, longitude, label, description }: MapViewComponentProps) {
  return <View style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
