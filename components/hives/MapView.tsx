import { Platform } from "react-native";

let MapViewComponent: any;

if (Platform.OS === "web") {
  MapViewComponent = require("./MapView.web").default;
} else {
  MapViewComponent = require("./MapView.native").default;
}

export default MapViewComponent;
