import { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Map as MapIcon, MapPin, Navigation, Plus, Sparkles, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../../../constants/colors";
import { useBeeMind } from "../../../store/beemind-context";
import { useLanguage } from "../../../store/language-store";

export default function YardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { yards, hives } = useBeeMind();
  const { t } = useLanguage();
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);

  const formatCountCopy = (template?: string, count?: number) => {
    if (!template || typeof count !== "number") {
      return undefined;
    }
    return template.replace("{{count}}", String(count));
  };

  const yardsWithLocation = useMemo(() => {
    return yards.filter((yard) => typeof yard.latitude === "number" && typeof yard.longitude === "number");
  }, [yards]);

  const hasYards = yards.length > 0;
  const hasYardsWithLocation = yardsWithLocation.length > 0;

  const handleAddYard = () => {
    console.log("[YardsScreen] Navigating to add yard form");
    router.push("/(tabs)/yards/new");
  };

  const handleOpenYard = (yardId: string) => {
    console.log("[YardsScreen] Opening yard detail", { yardId });
    router.push({ pathname: "/(tabs)/yards/[id]", params: { id: yardId } });
  };

  const openInMaps = (latitude: number, longitude: number, label: string) => {
    console.log("[YardsScreen] Opening coordinate in maps", { latitude, longitude, label });
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
      default: "https://www.google.com/maps/search/?api=1&query=",
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      default: `${scheme}${latLng}`,
    });
    Linking.openURL(url ?? "");
  };

  const getHiveCount = (yardId: string) => {
    return hives.filter((hive) => hive.yard_id === yardId).length;
  };

  const renderMapView = () => {
    return (
      <View style={styles.webMapContainer}>
        <Text style={styles.mapPlaceholder}>📍</Text>
        <Text style={styles.mapSubtext}>{t.yards.mapHelper ?? "Tap a yard to open it in your preferred map app."}</Text>
        <View style={styles.yardsListInMap}>
          {yardsWithLocation.map((yard) => (
            <TouchableOpacity
              key={yard.id}
              style={styles.yardInMapButton}
              onPress={() => openInMaps(yard.latitude ?? 0, yard.longitude ?? 0, yard.name)}
              testID={`yards-map-location-${yard.id}`}
            >
              <MapPin size={16} color={Colors.light.primary} />
              <View style={styles.yardInMapContent}>
                <Text style={styles.yardInMapText}>{yard.name}</Text>
                <Text style={styles.yardInMapCoords}>
                  {yard.latitude?.toFixed(4)}, {yard.longitude?.toFixed(4)}
                </Text>
              </View>
              <Navigation size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen} testID="yards-screen">
      <LinearGradient
        colors={["#0F172A", "#1E293B"]}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <Sparkles size={20} color="#FACC15" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{t.yards.titleHero ?? "Apiary yards"}</Text>
            <Text style={styles.heroSubtitle}>
              {hasYards
                ? formatCountCopy(t.yards.heroSubtitleWithCount, yards.length) ?? `${yards.length} curated locations to anchor your colonies.`
                : t.yards.heroSubtitleEmpty ?? "Designate your first apiary hub with coordinates, notes, and context."}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="yards-scroll-view"
      >
        <TouchableOpacity
          style={styles.createCard}
          onPress={handleAddYard}
          activeOpacity={0.88}
          testID="yards-add-card"
        >
          <View style={styles.createIconWrapper}>
            <Plus size={24} color="#0F172A" />
          </View>
          <View style={styles.createCopy}>
            <Text style={styles.createTitle}>{t.yards.quickCreateTitle ?? "Add a new yard"}</Text>
            <Text style={styles.createSubtitle}>
              {t.yards.quickCreateSubtitle ?? "Document access, orientation, and microclimate for smarter deployments."}
            </Text>
          </View>
        </TouchableOpacity>

        {hasYardsWithLocation && (
          <TouchableOpacity
            style={styles.mapPreviewCard}
            onPress={() => {
              console.log("[YardsScreen] Opening yards map modal");
              setMapModalVisible(true);
            }}
            activeOpacity={0.88}
            testID="yards-map-preview"
          >
            <View style={styles.mapPreviewHeader}>
              <MapIcon size={20} color={Colors.light.primary} />
              <Text style={styles.mapPreviewTitle}>{t.yards.viewMap ?? "View yards on map"}</Text>
            </View>
            <Text style={styles.mapPreviewSubtitle}>
              {formatCountCopy(t.yards.mapPreviewSubtitle, yardsWithLocation.length) ??
                `${yardsWithLocation.length} ${yardsWithLocation.length === 1 ? "yard" : "yards"} with precise coordinates`}
            </Text>
          </TouchableOpacity>
        )}

        {hasYards ? (
          <View style={styles.yardList} testID="yards-list">
            {yards.map((yard) => (
              <TouchableOpacity
                key={yard.id}
                style={styles.yardCard}
                onPress={() => handleOpenYard(yard.id)}
                activeOpacity={0.9}
                testID={`yards-list-item-${yard.id}`}
              >
                <View style={styles.yardIcon}>
                  <MapPin size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.yardContent}>
                  <Text style={styles.yardName}>{yard.name}</Text>
                  {yard.address ? <Text style={styles.yardAddress}>{yard.address}</Text> : null}
                  <View style={styles.yardStatsRow}>
                    <Text style={styles.yardStat}>{getHiveCount(yard.id)} {t.yards.hives}</Text>
                    {typeof yard.elevation_m === "number" ? (
                      <Text style={styles.yardStat}>{yard.elevation_m}{t.yards.elevationM}</Text>
                    ) : null}
                    {yard.latitude && yard.longitude ? (
                      <Text style={[styles.yardStat, styles.yardHasLocation]}>{t.yards.hasLocation ?? "Location saved"}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState} testID="yards-empty-state">
            <MapPin size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>{t.yards.noYards}</Text>
            <Text style={styles.emptyText}>{t.yards.addFirst}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={mapModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          console.log("[YardsScreen] Closing yards map modal");
          setMapModalVisible(false);
        }}
      >
        <View style={styles.mapModal}>
          <View style={[styles.mapModalHeader, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.mapModalTitle}>{t.yards.allYards ?? "All yards"}</Text>
            <TouchableOpacity
              onPress={() => {
                console.log("[YardsScreen] Closing yards map modal via close button");
                setMapModalVisible(false);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              testID="yards-map-close"
            >
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          {renderMapView()}
        </View>
      </Modal>
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
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#F8FAFC",
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(226, 232, 240, 0.9)",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
    gap: 20,
  },
  createCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: "rgba(15, 23, 42, 0.08)",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
      },
    }),
  },
  createIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
  },
  createCopy: {
    flex: 1,
    gap: 6,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  createSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    lineHeight: 20,
  },
  mapPreviewCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    padding: 20,
  },
  mapPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  mapPreviewTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#0F172A",
  },
  mapPreviewSubtitle: {
    fontSize: 14,
    color: "rgba(15, 23, 42, 0.75)",
  },
  yardList: {
    gap: 16,
  },
  yardCard: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: "rgba(15, 23, 42, 0.08)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
      },
    }),
  },
  yardIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  yardContent: {
    flex: 1,
    gap: 6,
  },
  yardName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  yardAddress: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  yardStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  yardStat: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  yardHasLocation: {
    color: Colors.light.primary,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  mapModal: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  mapModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  webMapContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
    backgroundColor: Colors.light.background,
  },
  mapPlaceholder: {
    fontSize: 40,
    textAlign: "center",
  },
  mapSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 22,
  },
  yardsListInMap: {
    gap: 12,
  },
  yardInMapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  yardInMapContent: {
    flex: 1,
    gap: 4,
  },
  yardInMapText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  yardInMapCoords: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
});
