import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Modal, TextInput, Alert } from "react-native";
import { PackageOpen, Plus, X, AlertTriangle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMind } from "@/store/beemind-context";
import { useLanguage } from "@/store/language-store";
import type { InventoryItemCategory } from "@/types";

export default function InventoryScreen() {
  const { inventory, addInventoryItem, updateInventoryItem } = useBeeMind();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "lowStock" | "inStock">("all");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "equipment" as InventoryItemCategory,
    quantity: "",
    unit: "",
    min_quantity: "",
    notes: "",
  });

  const filteredItems = inventory.filter((item) => {
    if (filter === "lowStock") {
      return item.min_quantity ? item.quantity < item.min_quantity : false;
    }
    if (filter === "inStock") {
      return !item.min_quantity || item.quantity >= item.min_quantity;
    }
    return true;
  });

  const sortedItems = filteredItems.sort((a, b) => {
    const aLowStock = a.min_quantity ? a.quantity < a.min_quantity : false;
    const bLowStock = b.min_quantity ? b.quantity < b.min_quantity : false;
    if (aLowStock !== bLowStock) return aLowStock ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const openModal = (item?: typeof inventory[0]) => {
    if (item) {
      setEditingItem(item.id);
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        min_quantity: item.min_quantity?.toString() || "",
        notes: item.notes || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        category: "equipment",
        quantity: "",
        unit: "",
        min_quantity: "",
        notes: "",
      });
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert(t.common.error, t.inventory.nameRequired);
      return;
    }
    if (!formData.quantity.trim()) {
      Alert.alert(t.common.error, t.inventory.quantityRequired);
      return;
    }

    const itemData = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingItem) {
      updateInventoryItem(editingItem, itemData);
      Alert.alert(t.common.success, t.inventory.updated);
    } else {
      addInventoryItem(itemData);
      Alert.alert(t.common.success, t.inventory.created);
    }

    setModalVisible(false);
  };

  const getCategoryLabel = (category: InventoryItemCategory) => {
    switch (category) {
      case "equipment":
        return t.inventory.equipment;
      case "feed":
        return t.inventory.feed;
      case "medication":
        return t.inventory.medication;
      case "packaging":
        return t.inventory.packaging;
      case "other":
        return t.inventory.other;
    }
  };

  const getCategoryColor = (category: InventoryItemCategory) => {
    switch (category) {
      case "equipment":
        return "#3B82F6";
      case "feed":
        return "#10B981";
      case "medication":
        return "#F59E0B";
      case "packaging":
        return "#8B5CF6";
      case "other":
        return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {(["all", "lowStock", "inStock"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}
            >
              {f === "all" ? t.inventory.all : f === "lowStock" ? t.inventory.lowStock : t.inventory.inStock}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {sortedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <PackageOpen size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>{t.inventory.noItems}</Text>
            <Text style={styles.emptyText}>{t.inventory.addFirst}</Text>
          </View>
        ) : (
          sortedItems.map((item) => {
            const isLowStock = item.min_quantity ? item.quantity < item.min_quantity : false;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, isLowStock && styles.itemCardLowStock]}
                onPress={() => openModal(item)}
              >
                {isLowStock && (
                  <View style={styles.lowStockBadge}>
                    <AlertTriangle size={16} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(item.category) + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: getCategoryColor(item.category) },
                        ]}
                      >
                        {getCategoryLabel(item.category)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.quantityRow}>
                    <Text style={styles.quantityLabel}>{t.inventory.quantity}:</Text>
                    <Text style={[styles.quantityValue, isLowStock && styles.quantityValueLow]}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  {item.min_quantity && (
                    <Text style={styles.minQuantity}>
                      {t.inventory.minQuantity}: {item.min_quantity} {item.unit}
                    </Text>
                  )}
                  {item.notes && (
                    <Text style={styles.itemNotes}>{item.notes}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? t.common.edit : t.inventory.newItem}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>{t.inventory.name} *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t.inventory.namePlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>{t.inventory.category}</Text>
              <View style={styles.categoryGroup}>
                {(["equipment", "feed", "medication", "packaging", "other"] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      formData.category === cat && {
                        backgroundColor: getCategoryColor(cat),
                        borderColor: getCategoryColor(cat),
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t.inventory.quantity} *</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder={t.inventory.quantityPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>{t.inventory.unit} *</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                placeholder={t.inventory.unitPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>{t.inventory.minQuantity}</Text>
              <TextInput
                style={styles.input}
                value={formData.min_quantity}
                onChangeText={(text) => setFormData({ ...formData, min_quantity: text })}
                placeholder={t.inventory.minQuantityPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />

              <Text style={styles.label}>{t.inventory.notes}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder={t.inventory.notesPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              {editingItem && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger]}
                  onPress={() => {
                    Alert.alert(
                      t.common.delete,
                      `${t.common.delete} ${formData.name}?`,
                      [
                        { text: t.common.cancel, style: "cancel" },
                        {
                          text: t.common.delete,
                          style: "destructive",
                          onPress: () => {
                            deleteInventoryItem(editingItem);
                            setModalVisible(false);
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.buttonDangerText}>{t.common.delete}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, editingItem && { flex: 1 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, editingItem && { flex: 1 }]}
                onPress={handleSave}
              >
                <Text style={styles.buttonPrimaryText}>
                  {editingItem ? t.common.save : t.common.create}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  content: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  itemCardLowStock: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
  },
  lowStockBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: Colors.light.error,
    borderRadius: 12,
    padding: 4,
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  itemDetails: {
    gap: 6,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityLabel: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  quantityValueLow: {
    color: Colors.light.error,
  },
  minQuantity: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  itemNotes: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  categoryGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonDanger: {
    backgroundColor: Colors.light.error,
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
  buttonDangerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
