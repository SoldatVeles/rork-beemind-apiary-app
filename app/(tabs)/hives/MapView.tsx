import React from "react";
import { Platform } from "react-native";

interface MapViewComponentProps {
  latitude: number;
  longitude: number;
  label: string;
  description: string;
}

export default function MapViewComponent(props: MapViewComponentProps) {
  if (Platform.OS === 'web') {
    const MapViewWeb = require('./MapView.web').default;
    return <MapViewWeb {...props} />;
  }
  
  const MapViewNative = require('./MapView.native').default;
  return <MapViewNative {...props} />;
}
