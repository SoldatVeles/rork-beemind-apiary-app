import { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Modal, TextInput, Alert } from "react-native";
import { CheckSquare, Plus, Square, RotateCcw, MapPin, Trash2, Edit3, Filter, SortAsc } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMindStore } from "@/store/beemind-store";
import { useLanguage } from "@/store/language-store";
import type { TaskPriority, TaskScope } from "@/types";

export default function TasksScreen() {
  const { tasks, updateTask, addTask, deleteTask, hives, yards } = useBeeMindStore();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [scopeFilter, setScopeFilter] = useState<"all" | TaskScope>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "created">("priority");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    scope: "org" as TaskScope,
    yard_id: "",
    hive_id: "",
    due_at: "",
    priority: 2 as TaskPriority,
    notes: "",
  });

  useEffect(() => {
    if (recentlyCompleted) {
      const timer = setTimeout(() => {
        setRecentlyCompleted(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recentlyCompleted]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending" && task.is_done) return false;
    if (filter === "completed" && !task.is_done) return false;
    
    if (scopeFilter !== "all" && task.scope !== scopeFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    
    if (sortBy === "priority") {
      if (a.priority !== b.priority) return a.priority - b.priority;
    } else if (sortBy === "dueDate") {
      if (a.due_at && b.due_at) {
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      }
      if (a.due_at && !b.due_at) return -1;
      if (!a.due_at && b.due_at) return 1;
    } else if (sortBy === "created") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    return 0;
  });

  const toggleTask = (taskId: string, isDone: boolean) => {
    if (!isDone) {
      updateTask(taskId, { is_done: true, completed_at: new Date().toISOString() });
      setRecentlyCompleted(taskId);
    } else {
      updateTask(taskId, { is_done: false, completed_at: undefined });
      Alert.alert(t.common.success, t.tasks.reactivated);
    }
  };

  const undoCompletion = (taskId: string) => {
    updateTask(taskId, { is_done: false, completed_at: undefined });
    setRecentlyCompleted(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t.home.today;
    if (diffDays === 1) return t.home.tomorrow;
    if (diffDays === -1) return t.home.yesterday;
    if (diffDays < 0) return `${Math.abs(diffDays)} ${t.home.daysAgo}`;
    return `${t.home.inDays} ${diffDays} days`;
  };

  const formatCompletedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTaskLocation = (task: typeof tasks[0]) => {
    if (task.hive_id) {
      const hive = hives.find((h) => h.id === task.hive_id);
      const yard = hive ? yards.find((y) => y.id === hive.yard_id) : null;
      return {
        primary: hive?.label || "Unknown Hive",
        secondary: yard?.name,
      };
    }
    if (task.yard_id) {
      const yard = yards.find((y) => y.id === task.yard_id);
      return {
        primary: yard?.name || "Unknown Yard",
        secondary: undefined,
      };
    }
    return {
      primary: t.tasks.org,
      secondary: undefined,
    };
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 1:
        return Colors.light.error;
      case 2:
        return Colors.light.warning;
      case 3:
        return Colors.light.success;
      default:
        return Colors.light.tabIconDefault;
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 1:
        return t.tasks.high;
      case 2:
        return t.tasks.medium;
      case 3:
        return t.tasks.low;
      default:
        return "";
    }
  };

  const handleEdit = (task: typeof tasks[0]) => {
    setEditingTask(task.id);
    setFormData({
      title: task.title,
      scope: task.scope,
      yard_id: task.yard_id || "",
      hive_id: task.hive_id || "",
      due_at: task.due_at || "",
      priority: task.priority,
      notes: task.notes || "",
    });
    setModalVisible(true);
  };

  const handleDelete = (taskId: string, taskTitle: string) => {
    Alert.alert(
      t.common.confirm,
      `${t.tasks.deleteConfirm} "${taskTitle}"?`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.delete,
          style: "destructive",
          onPress: () => {
            deleteTask(taskId);
            Alert.alert(t.common.success, t.tasks.deleted);
          },
        },
      ]
    );
  };

  const handleDuplicate = (task: typeof tasks[0]) => {
    addTask({
      title: `${task.title} (${t.tasks.copy})`,
      scope: task.scope,
      yard_id: task.yard_id,
      hive_id: task.hive_id,
      due_at: task.due_at,
      priority: task.priority,
      notes: task.notes,
      is_done: false,
    });
    Alert.alert(t.common.success, t.tasks.duplicated);
  };

  const getOverdueCount = () => {
    const now = new Date();
    return tasks.filter(t => !t.is_done && t.due_at && new Date(t.due_at) < now).length;
  };

  const getDueTodayCount = () => {
    const today = new Date().toDateString();
    return tasks.filter(t => !t.is_done && t.due_at && new Date(t.due_at).toDateString() === today).length;
  };

  const activeFiltersCount = (scopeFilter !== "all" ? 1 : 0) + (priorityFilter !== "all" ? 1 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {(["pending", "all", "completed"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}
              >
                {t.tasks[f].charAt(0).toUpperCase() + t.tasks[f].slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={[styles.iconButton, activeFiltersCount > 0 && styles.iconButtonActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color={activeFiltersCount > 0 ? "#FFFFFF" : Colors.light.primary} />
            {activeFiltersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              const order: ("priority" | "dueDate" | "created")[] = ["priority", "dueDate", "created"];
              const currentIndex = order.indexOf(sortBy);
              setSortBy(order[(currentIndex + 1) % order.length]);
            }}
          >
            <SortAsc size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {(getOverdueCount() > 0 || getDueTodayCount() > 0) && filter === "pending" && (
        <View style={styles.statsBar}>
          {getOverdueCount() > 0 && (
            <View style={[styles.statCard, styles.statCardOverdue]}>
              <Text style={styles.statNumber}>{getOverdueCount()}</Text>
              <Text style={styles.statLabel}>{t.tasks.overdue}</Text>
            </View>
          )}
          {getDueTodayCount() > 0 && (
            <View style={[styles.statCard, styles.statCardToday]}>
              <Text style={styles.statNumber}>{getDueTodayCount()}</Text>
              <Text style={styles.statLabel}>{t.tasks.dueToday}</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {sortedTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckSquare size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>{t.tasks.noTasks}</Text>
            <Text style={styles.emptyText}>
              {filter === "completed" ? t.tasks.noCompleted : t.tasks.addFirst}
            </Text>
          </View>
        ) : (
          sortedTasks.map((task) => {
            const location = getTaskLocation(task);
            const isRecentlyCompleted = recentlyCompleted === task.id;

            return (
              <View key={task.id} style={styles.taskWrapper}>
                <TouchableOpacity
                  style={[styles.taskCard, task.is_done && styles.taskCardCompleted]}
                  onPress={() => toggleTask(task.id, task.is_done)}
                >
                  <View style={styles.taskCheckbox}>
                    {task.is_done ? (
                      <CheckSquare size={24} color={Colors.light.success} />
                    ) : (
                      <Square size={24} color={Colors.light.tabIconDefault} />
                    )}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, task.is_done && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <View style={styles.taskLocationContainer}>
                        <MapPin size={14} color={Colors.light.tabIconDefault} />
                        <Text style={styles.taskLocation}>{location.primary}</Text>
                        {location.secondary && (
                          <Text style={styles.taskLocationSecondary}> • {location.secondary}</Text>
                        )}
                      </View>
                      {task.due_at && !task.is_done && (
                        <Text style={styles.taskDue}>{formatDate(task.due_at)}</Text>
                      )}
                      {task.is_done && task.completed_at && (
                        <Text style={styles.taskCompleted}>
                          {t.tasks.completedOn} {formatCompletedDate(task.completed_at)}
                        </Text>
                      )}
                    </View>
                    {task.notes && (
                      <Text style={styles.taskNotes} numberOfLines={2}>
                        {task.notes}
                      </Text>
                    )}
                  </View>
                  <View style={styles.taskRight}>
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(task.priority) },
                      ]}
                    />
                    {task.is_done ? (
                      <TouchableOpacity
                        style={styles.reactivateButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id, task.is_done);
                        }}
                      >
                        <RotateCcw size={18} color={Colors.light.primary} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.taskActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEdit(task);
                          }}
                        >
                          <Edit3 size={16} color={Colors.light.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.taskActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id, task.title);
                          }}
                        >
                          <Trash2 size={16} color={Colors.light.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {isRecentlyCompleted && (
                  <TouchableOpacity
                    style={styles.undoBar}
                    onPress={() => undoCompletion(task.id)}
                  >
                    <Text style={styles.undoText}>
                      {t.tasks.completed} • {t.tasks.undo}
                    </Text>
                    <RotateCcw size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
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
              <Text style={styles.modalTitle}>{editingTask ? t.tasks.editTask : t.tasks.newTask}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>{t.tasks.taskTitle} *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder={t.tasks.titlePlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>{t.tasks.scope}</Text>
              <View style={styles.scopeGroup}>
                {(["org", "yard", "hive"] as const).map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    style={[
                      styles.scopeButton,
                      formData.scope === scope && styles.scopeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, scope, yard_id: "", hive_id: "" })}
                  >
                    <Text
                      style={[
                        styles.scopeButtonText,
                        formData.scope === scope && styles.scopeButtonTextActive,
                      ]}
                    >
                      {scope === "org"
                        ? t.tasks.org
                        : scope === "yard"
                        ? t.hives.yard
                        : t.tabs.hives}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.scope === "yard" && (
                <>
                  <Text style={styles.label}>{t.hives.yard}</Text>
                  <View style={styles.pickerContainer}>
                    {yards.map((yard) => (
                      <TouchableOpacity
                        key={yard.id}
                        style={[
                          styles.pickerOption,
                          formData.yard_id === yard.id && styles.pickerOptionSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, yard_id: yard.id })}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.yard_id === yard.id && styles.pickerOptionTextSelected,
                          ]}
                        >
                          {yard.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {formData.scope === "hive" && (
                <>
                  <Text style={styles.label}>{t.inspections.hive}</Text>
                  <View style={styles.pickerContainer}>
                    {hives.map((hive) => {
                      const yard = yards.find((y) => y.id === hive.yard_id);
                      return (
                        <TouchableOpacity
                          key={hive.id}
                          style={[
                            styles.pickerOption,
                            formData.hive_id === hive.id && styles.pickerOptionSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, hive_id: hive.id })}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              formData.hive_id === hive.id && styles.pickerOptionTextSelected,
                            ]}
                          >
                            {hive.label}
                          </Text>
                          {yard && (
                            <Text
                              style={[
                                styles.pickerOptionSubtext,
                                formData.hive_id === hive.id && styles.pickerOptionSubtextSelected,
                              ]}
                            >
                              {yard.name}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.label}>{t.tasks.priority}</Text>
              <View style={styles.priorityGroup}>
                {([1, 2, 3] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority && styles.priorityButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, priority })}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(priority) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityButtonText,
                        formData.priority === priority && styles.priorityButtonTextActive,
                      ]}
                    >
                      {getPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t.tasks.dueDate}</Text>
              <TextInput
                style={styles.input}
                value={formData.due_at}
                onChangeText={(text) => setFormData({ ...formData, due_at: text })}
                placeholder={t.tasks.dueDatePlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
              />

              <Text style={styles.label}>{t.tasks.notes}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder={t.tasks.notesPlaceholder}
                placeholderTextColor={Colors.light.tabIconDefault}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => {
                  if (!formData.title.trim()) {
                    Alert.alert(t.common.error, t.tasks.titleRequired);
                    return;
                  }
                  if (formData.scope === "yard" && !formData.yard_id) {
                    Alert.alert(t.common.error, t.tasks.yardRequired);
                    return;
                  }
                  if (formData.scope === "hive" && !formData.hive_id) {
                    Alert.alert(t.common.error, t.tasks.hiveRequired);
                    return;
                  }

                  if (editingTask) {
                    updateTask(editingTask, {
                      title: formData.title,
                      scope: formData.scope,
                      yard_id: formData.yard_id || undefined,
                      hive_id: formData.hive_id || undefined,
                      due_at: formData.due_at || undefined,
                      notes: formData.notes || undefined,
                      priority: formData.priority,
                    });
                    Alert.alert(t.common.success, t.tasks.updated);
                  } else {
                    addTask({
                      title: formData.title,
                      scope: formData.scope,
                      yard_id: formData.yard_id || undefined,
                      hive_id: formData.hive_id || undefined,
                      due_at: formData.due_at || undefined,
                      notes: formData.notes || undefined,
                      priority: formData.priority,
                      is_done: false,
                    });
                    Alert.alert(t.common.success, t.tasks.created);
                  }

                  setFormData({
                    title: "",
                    scope: "org",
                    yard_id: "",
                    hive_id: "",
                    due_at: "",
                    priority: 2,
                    notes: "",
                  });
                  setEditingTask(null);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.buttonPrimaryText}>{editingTask ? t.tasks.updateTask : t.tasks.createTask}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.tasks.filters}</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>{t.tasks.scope}</Text>
              <View style={styles.filterGroup}>
                <TouchableOpacity
                  style={[styles.filterOption, scopeFilter === "all" && styles.filterOptionActive]}
                  onPress={() => setScopeFilter("all")}
                >
                  <Text style={[styles.filterOptionText, scopeFilter === "all" && styles.filterOptionTextActive]}>
                    {t.tasks.all}
                  </Text>
                </TouchableOpacity>
                {(["org", "yard", "hive"] as const).map((scope) => (
                  <TouchableOpacity
                    key={scope}
                    style={[styles.filterOption, scopeFilter === scope && styles.filterOptionActive]}
                    onPress={() => setScopeFilter(scope)}
                  >
                    <Text style={[styles.filterOptionText, scopeFilter === scope && styles.filterOptionTextActive]}>
                      {scope === "org" ? t.tasks.org : scope === "yard" ? t.hives.yard : t.tabs.hives}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t.tasks.priority}</Text>
              <View style={styles.filterGroup}>
                <TouchableOpacity
                  style={[styles.filterOption, priorityFilter === "all" && styles.filterOptionActive]}
                  onPress={() => setPriorityFilter("all")}
                >
                  <Text style={[styles.filterOptionText, priorityFilter === "all" && styles.filterOptionTextActive]}>
                    {t.tasks.all}
                  </Text>
                </TouchableOpacity>
                {([1, 2, 3] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[styles.filterOption, priorityFilter === priority && styles.filterOptionActive]}
                    onPress={() => setPriorityFilter(priority)}
                  >
                    <View style={styles.filterPriorityContent}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                      <Text style={[styles.filterOptionText, priorityFilter === priority && styles.filterOptionTextActive]}>
                        {getPriorityLabel(priority)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t.tasks.sortBy}</Text>
              <View style={styles.filterGroup}>
                {(["priority", "dueDate", "created"] as const).map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[styles.filterOption, sortBy === sort && styles.filterOptionActive]}
                    onPress={() => setSortBy(sort)}
                  >
                    <Text style={[styles.filterOptionText, sortBy === sort && styles.filterOptionTextActive]}>
                      {t.tasks[sort]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setScopeFilter("all");
                  setPriorityFilter("all");
                  setSortBy("priority");
                }}
              >
                <Text style={styles.buttonSecondaryText}>{t.tasks.clearFilters}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.buttonPrimaryText}>{t.common.apply}</Text>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  topBarActions: {
    flexDirection: "row",
    paddingRight: 16,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  statsBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statCardOverdue: {
    backgroundColor: Colors.light.error + "20",
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  statCardToday: {
    backgroundColor: Colors.light.warning + "20",
    borderWidth: 1,
    borderColor: Colors.light.warning,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
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
  taskWrapper: {
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
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
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.light.tabIconDefault,
  },
  taskMeta: {
    flexDirection: "column",
    gap: 4,
  },
  taskLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskLocation: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  taskLocationSecondary: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    opacity: 0.7,
  },
  taskDue: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500" as const,
  },
  taskCompleted: {
    fontSize: 12,
    color: Colors.light.success,
    fontStyle: "italic",
  },
  taskNotes: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    marginTop: 6,
    fontStyle: "italic",
  },
  taskRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  reactivateButton: {
    padding: 6,
    backgroundColor: Colors.light.primary + "20",
    borderRadius: 8,
  },
  taskActions: {
    flexDirection: "row",
    gap: 4,
  },
  taskActionButton: {
    padding: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  undoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.success,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  undoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500" as const,
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
  closeButton: {
    fontSize: 24,
    color: Colors.light.tabIconDefault,
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
  scopeGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  scopeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  scopeButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  scopeButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  scopeButtonTextActive: {
    color: "#FFFFFF",
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.light.primary + "20",
    borderColor: Colors.light.primary,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerOptionTextSelected: {
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  pickerOptionSubtext: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  pickerOptionSubtextSelected: {
    color: Colors.light.primary,
    opacity: 0.8,
  },
  priorityGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  priorityButtonActive: {
    backgroundColor: Colors.light.primary + "10",
    borderColor: Colors.light.primary,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  priorityButtonTextActive: {
    color: Colors.light.primary,
    fontWeight: "600" as const,
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
  filterGroup: {
    gap: 8,
    marginBottom: 16,
  },
  filterOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.light.primary + "20",
    borderColor: Colors.light.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: "center",
  },
  filterOptionTextActive: {
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  filterPriorityContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
