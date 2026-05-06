import { useState, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MapPin, NotebookPen, Save } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../../constants/colors";
import { useBeeMind } from "../../../store/beemind-context";
import { useLanguage } from "../../../store/language-store";

interface YardFormState {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  elevation: string;
  notes: string;
}

export default function AddYardScreen() {
  const router = useRouter();
  const { addYard } = useBeeMind();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [formState, setFormState] = useState<YardFormState>({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    elevation: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isLocationPartiallyFilled = useMemo(() => {
    return Boolean(formState.latitude || formState.longitude);
  }, [formState.latitude, formState.longitude]);

  const handleChange = (key: keyof YardFormState, value: string) => {
    setFormState((previous) => ({ ...previous, [key]: value }));
  };

  const parseCoordinate = (value: string) => {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number.parseFloat(value);

    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  };

  const parseElevation = (value: string) => {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number.parseFloat(value);

    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  };

  const handleSubmit = async () => {
    console.log("[AddYardScreen] handleSubmit invoked", formState);

    if (isSubmitting) {
      return;
    }

    if (!formState.name.trim()) {
      Alert.alert("Apiary name required", "Give this apiary (yard) a short, recognisable name like 'Home Garden' or 'Orchard'.");
      return;
    }
    if (formState.name.trim().length > 80) {
      Alert.alert("Name too long", "Keep apiary names under 80 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const latitudeValue = parseCoordinate(formState.latitude);
      const longitudeValue = parseCoordinate(formState.longitude);
      const elevationValue = parseElevation(formState.elevation);

      if (latitudeValue === null || longitudeValue === null) {
        Alert.alert(t.common.error, t.yards.invalidCoordinateMessage ?? "Please provide valid numeric coordinates.");
        setIsSubmitting(false);
        return;
      }

      if (elevationValue === null) {
        Alert.alert(t.common.error, t.yards.invalidElevationMessage ?? "Please provide a valid elevation.");
        setIsSubmitting(false);
        return;
      }

      if (isLocationPartiallyFilled && (latitudeValue === undefined || longitudeValue === undefined)) {
        Alert.alert(t.common.error, t.yards.locationPairRequired ?? "Please provide both latitude and longitude to save a location.");
        setIsSubmitting(false);
        return;
      }

      const createdYard = await addYard({
        name: formState.name.trim(),
        address: formState.address.trim() || undefined,
        latitude: latitudeValue,
        longitude: longitudeValue,
        notes: formState.notes.trim() || undefined,
      });

      console.log("[AddYardScreen] yard created", { id: createdYard.id });

      setFormState({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        elevation: "",
        notes: "",
      });

      Alert.alert(t.common.success, t.yards.created, [
        {
          text: t.common.view ?? "View",
          onPress: () => {
            router.replace({ pathname: "/(tabs)/yards/[id]", params: { id: createdYard.id } });
          },
        },
        {
          text: t.common.done ?? "Done",
          onPress: () => {
            router.back();
          },
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("[AddYardScreen] failed to create yard", error);
      Alert.alert(t.common.error, t.yards.creationFailedMessage ?? "We could not save the yard. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <View style={styles.screen} testID="add-yard-screen">
      <LinearGradient
        colors={["#0F172A", "#1E293B"]}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIconWrapper}>
            <MapPin size={24} color="#FACC15" />
          </View>
          <Text style={styles.heroTitle}>{t.yards.newYard ?? "Create a new yard"}</Text>
          <Text style={styles.heroSubtitle}>
            {t.yards.newYardSubtitle ?? "Capture precise locations, notes, and hive-ready details in a single view."}
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.select({ ios: "padding", default: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 96, default: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          testID="add-yard-form"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.yards.detailsHeading ?? "Yard details"}</Text>
            <Text style={styles.sectionSubtitle}>
              {t.yards.detailsSubheading ?? "Give this yard a meaningful name and optional address so you can find it faster."}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.yards.name} *</Text>
              <TextInput
                style={styles.input}
                value={formState.name}
                onChangeText={(text) => handleChange("name", text)}
                placeholder={t.yards.namePlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                autoCapitalize="words"
                testID="add-yard-name-input"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.yards.address}</Text>
              <TextInput
                style={styles.input}
                value={formState.address}
                onChangeText={(text) => handleChange("address", text)}
                placeholder={t.yards.addressPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                testID="add-yard-address-input"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.yards.locationHeading ?? "Map coordinates"}</Text>
            <Text style={styles.sectionSubtitle}>
              {t.yards.locationSubheading ?? "Drop in exact latitude and longitude for navigation and hive tracking."}
            </Text>

            <View style={styles.coordinateRow}>
              <View style={styles.coordinateField}>
                <Text style={styles.label}>{t.yards.latitude ?? "Latitude"}</Text>
                <TextInput
                  style={styles.input}
                  value={formState.latitude}
                  onChangeText={(text) => handleChange("latitude", text)}
                  placeholder="40.7128"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  keyboardType="decimal-pad"
                  testID="add-yard-latitude-input"
                />
              </View>
              <View style={styles.coordinateField}>
                <Text style={styles.label}>{t.yards.longitude ?? "Longitude"}</Text>
                <TextInput
                  style={styles.input}
                  value={formState.longitude}
                  onChangeText={(text) => handleChange("longitude", text)}
                  placeholder="-73.9352"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  keyboardType="decimal-pad"
                  testID="add-yard-longitude-input"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.yards.elevation}</Text>
              <TextInput
                style={styles.input}
                value={formState.elevation}
                onChangeText={(text) => handleChange("elevation", text)}
                placeholder={t.yards.elevationPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="decimal-pad"
                testID="add-yard-elevation-input"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.yards.notes}</Text>
            <Text style={styles.sectionSubtitle}>
              {t.yards.notesHelper ?? "Capture microclimate, forage, or access details for the team."}
            </Text>
            <View style={styles.fieldGroup}>
              <View style={styles.notesHeader}>
                <NotebookPen size={16} color={Colors.light.primary} />
                <Text style={styles.notesHint}>{t.yards.notesPlaceholder}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formState.notes}
                onChangeText={(text) => handleChange("notes", text)}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder={t.yards.notesPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                testID="add-yard-notes-input"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
          testID="add-yard-submit-button"
        >
          <Save size={20} color="#0F172A" />
          <Text style={styles.primaryButtonLabel}>
            {isSubmitting ? t.common.saving ?? "Saving" : t.yards.createYard}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            console.log("[AddYardScreen] cancel pressed");
            router.back();
          }}
          activeOpacity={0.85}
          testID="add-yard-cancel-button"
        >
          <Text style={styles.secondaryButtonLabel}>{t.common.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: Platform.select({ ios: 32, android: 24, default: 24 }),
    paddingBottom: 32,
  },
  heroContent: {
    gap: 12,
  },
  heroIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#F8FAFC",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(226, 232, 240, 0.9)",
    lineHeight: 22,
  },
  formWrapper: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.light.background,
  },
  formContent: {
    padding: 24,
    paddingBottom: 160,
    gap: 20,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: "rgba(15, 23, 42, 0.1)",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: Colors.light.tabIconDefault,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  coordinateRow: {
    flexDirection: "row",
    gap: 16,
  },
  coordinateField: {
    flex: 1,
    gap: 8,
  },
  textArea: {
    minHeight: 140,
  },
  notesHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  notesHint: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FACC15",
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#0F172A",
  },
  secondaryButton: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryButtonLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
});
