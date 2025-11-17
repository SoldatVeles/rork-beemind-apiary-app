import { Platform } from "react-native";

const MapLocationPicker = Platform.select({
  web: require("./MapLocationPicker.web").default,
  default: require("./MapLocationPicker.native").default,
});

export default MapLocationPicker;
