import React from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Crown, Check, X, Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/store/language-store";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional reason shown above the feature list (e.g. why the modal appeared). */
  reason?: string;
}

export default function UpgradeModal({ visible, onClose, reason }: UpgradeModalProps) {
  const { t } = useLanguage();
  const pro = (t as unknown as { pro?: Record<string, string> }).pro ?? {};

  const title = pro.upgradeTitle ?? "Unlock BeeMind Pro";
  const subtitle = pro.upgradeSubtitle ?? "Grow your apiary without limits.";
  const benefits: string[] = [
    pro.benefitUnlimitedHives ?? "Unlimited hives",
    pro.benefitFullHistory ?? "Full tracking history",
    pro.benefitInsights ?? "Better insights & advanced stats",
    pro.benefitExport ?? "Export reports (CSV / PDF)",
    pro.benefitFuture ?? "Early access to future premium features",
  ];
  const upgradeLabel = pro.upgradeCta ?? "Upgrade";
  const laterLabel = pro.maybeLater ?? "Maybe later";
  const comingSoon = pro.comingSoon ?? "Payments coming soon";

  const handleUpgrade = () => {
    console.log("[UpgradeModal] upgrade pressed (placeholder)");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet} testID="upgrade-modal">
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="upgrade-close"
            accessibilityLabel="Close"
          >
            <X size={22} color={Colors.light.text} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.crownBadge}>
              <Crown size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {reason ? (
              <View style={styles.reasonBox}>
                <Sparkles size={16} color={Colors.light.primary} />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ) : null}

            <View style={styles.benefits}>
              {benefits.map((b) => (
                <View key={b} style={styles.benefitRow}>
                  <View style={styles.checkBadge}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.comingSoon}>{comingSoon}</Text>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              testID="upgrade-later"
            >
              <Text style={styles.buttonSecondaryText}>{laterLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleUpgrade}
              testID="upgrade-cta"
            >
              <Crown size={18} color="#FFFFFF" />
              <Text style={styles.buttonPrimaryText}>{upgradeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: Platform.select({ ios: 24, default: 16 }),
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: "center",
  },
  crownBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 22,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    alignSelf: "stretch",
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  benefits: {
    marginTop: 24,
    alignSelf: "stretch",
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  comingSoon: {
    marginTop: 24,
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  buttonSecondaryText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
