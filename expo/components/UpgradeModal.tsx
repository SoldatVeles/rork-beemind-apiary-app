import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Crown, Check, X, Sparkles, RefreshCw } from "lucide-react-native";
import Purchases, {
  type PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useLanguage } from "@/store/language-store";
import { trackEvent } from "@/lib/analytics";
import {
  configurePurchases,
  fetchCurrentOffering,
  isConfigured,
} from "@/lib/revenuecat";
import { usePro } from "@/store/pro-store";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional reason shown above the feature list (e.g. why the modal appeared). */
  reason?: string;
}

export default function UpgradeModal({ visible, onClose, reason }: UpgradeModalProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { refreshEntitlement } = usePro();
  const pro = (t as unknown as { pro?: Record<string, string> }).pro ?? {};

  const offeringQuery = useQuery({
    queryKey: ["rc", "offering"],
    queryFn: fetchCurrentOffering,
    enabled: visible,
    staleTime: 1000 * 60 * 5,
  });

  const monthlyPackage: PurchasesPackage | null = useMemo(() => {
    const offering = offeringQuery.data;
    if (!offering) return null;
    return offering.monthly ?? offering.availablePackages[0] ?? null;
  }, [offeringQuery.data]);

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      if (!configurePurchases()) {
        throw new Error("RevenueCat is not configured");
      }
      const result = await Purchases.purchasePackage(pkg);
      return result;
    },
    onSuccess: async () => {
      await refreshEntitlement();
      await queryClient.invalidateQueries({ queryKey: ["rc"] });
      onClose();
      Alert.alert(
        pro.purchaseSuccessTitle ?? "Welcome to Pro",
        pro.purchaseSuccessMessage ?? "Thanks for supporting BeeMind. Everything is unlocked.",
      );
    },
    onError: (err: unknown) => {
      const code = (err as { userCancelled?: boolean; code?: string })?.code;
      const cancelled = (err as { userCancelled?: boolean })?.userCancelled === true
        || code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
      if (cancelled) {
        if (__DEV__) console.log("[UpgradeModal] purchase cancelled");
        return;
      }
      if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        Alert.alert(
          pro.purchasePendingTitle ?? "Payment pending",
          pro.purchasePendingMessage ?? "Your purchase is pending approval. You'll get Pro access once it completes.",
        );
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert(
        pro.purchaseFailedTitle ?? "Purchase failed",
        message || (pro.purchaseFailedMessage ?? "Something went wrong. Please try again."),
      );
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!configurePurchases()) {
        throw new Error("RevenueCat is not configured");
      }
      return Purchases.restorePurchases();
    },
    onSuccess: async (info) => {
      await refreshEntitlement();
      const hasPro = info.entitlements.active.pro !== undefined;
      if (hasPro) {
        onClose();
        Alert.alert(
          pro.restoreSuccessTitle ?? "Pro restored",
          pro.restoreSuccessMessage ?? "Your Pro access has been restored.",
        );
      } else {
        Alert.alert(
          pro.restoreEmptyTitle ?? "No purchases found",
          pro.restoreEmptyMessage ?? "We couldn't find any active subscriptions on this account.",
        );
      }
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert(pro.restoreFailedTitle ?? "Restore failed", message);
    },
  });

  const title = pro.upgradeTitle ?? "Unlock BeeMind Pro";
  const subtitle = pro.upgradeSubtitle ?? "Grow your apiary without limits.";
  const benefits: string[] = [
    pro.benefitUnlimitedHives ?? "Unlimited hives",
    pro.benefitFullHistory ?? "Full tracking history",
    pro.benefitInsights ?? "Better insights & advanced stats",
    pro.benefitExport ?? "Export reports (CSV / PDF)",
    pro.benefitFuture ?? "Early access to future premium features",
  ];
  const laterLabel = pro.maybeLater ?? "Maybe later";
  const restoreLabel = pro.restore ?? "Restore Purchases";

  const priceLabel = monthlyPackage?.product?.priceString ?? "$4.99";
  const periodLabel = pro.perMonth ?? "/ month";
  const upgradeLabel = monthlyPackage
    ? `${pro.subscribeFor ?? "Subscribe for"} ${priceLabel}`
    : (pro.upgradeCta ?? "Upgrade");

  const handleUpgrade = useCallback(() => {
    if (!monthlyPackage) {
      Alert.alert(
        pro.unavailableTitle ?? "Unavailable",
        pro.unavailableMessage ?? "Subscriptions are not available right now. Please try again later.",
      );
      return;
    }
    trackEvent("upgrade_clicked", { source: reason ? "reason_modal" : "settings" });
    purchaseMutation.mutate(monthlyPackage);
  }, [monthlyPackage, purchaseMutation, reason, pro]);

  const handleRestore = useCallback(() => {
    restoreMutation.mutate();
  }, [restoreMutation]);

  const isBusy = purchaseMutation.isPending || restoreMutation.isPending;
  const loadingOffering = offeringQuery.isLoading || (visible && !isConfigured() && offeringQuery.isFetching);

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
            disabled={isBusy}
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

            <View style={styles.priceCard}>
              {loadingOffering ? (
                <ActivityIndicator color={Colors.light.primary} />
              ) : (
                <>
                  <Text style={styles.priceValue}>{priceLabel}</Text>
                  <Text style={styles.pricePeriod}>{periodLabel}</Text>
                </>
              )}
            </View>
            <Text style={styles.disclaimer}>
              {pro.disclaimer ?? "Auto-renews monthly. Cancel anytime in your store account."}
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              testID="upgrade-later"
              disabled={isBusy}
            >
              <Text style={styles.buttonSecondaryText}>{laterLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, (!monthlyPackage || isBusy) && styles.buttonDisabled]}
              onPress={handleUpgrade}
              disabled={!monthlyPackage || isBusy}
              testID="upgrade-cta"
            >
              {purchaseMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Crown size={18} color="#FFFFFF" />
                  <Text style={styles.buttonPrimaryText}>{upgradeLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.restoreRow}
            onPress={handleRestore}
            disabled={isBusy}
            testID="upgrade-restore"
          >
            {restoreMutation.isPending ? (
              <ActivityIndicator color={Colors.light.primary} size="small" />
            ) : (
              <RefreshCw size={14} color={Colors.light.primary} />
            )}
            <Text style={styles.restoreText}>{restoreLabel}</Text>
          </TouchableOpacity>
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
    maxHeight: "92%",
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
  priceCard: {
    marginTop: 24,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 56,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  pricePeriod: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontWeight: "500" as const,
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
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
  buttonDisabled: {
    opacity: 0.6,
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
  restoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "600" as const,
  },
});
