import { Platform } from "react-native";

let MapLocationPicker: any;

if (Platform.OS === "web") {
  MapLocationPicker = require("./MapLocationPicker.web").default;
} else {
  MapLocationPicker = require("./MapLocationPicker.native").default;
}

export default MapLocationPicker;
