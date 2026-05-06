import { create } from "zustand";
import type { HiveStatus, TaskPriority, TaskScope, InventoryItemCategory } from "@/types";

/**
 * UI-only Zustand store for transient view state (filters, modals, sort).
 * All business data is sourced from Supabase via `useBeeMind`.
 */
interface BeeMindUIState {
  hiveSearch: string;
  hiveStatusFilter: HiveStatus | "All";
  taskFilter: "all" | "pending" | "completed";
  taskScopeFilter: "all" | TaskScope;
  taskPriorityFilter: "all" | TaskPriority;
  taskSortBy: "priority" | "dueDate" | "created";
  inventoryFilter: "all" | "lowStock" | "inStock";
  inventoryCategoryFilter: "all" | InventoryItemCategory;

  setHiveSearch: (value: string) => void;
  setHiveStatusFilter: (value: HiveStatus | "All") => void;
  setTaskFilter: (value: "all" | "pending" | "completed") => void;
  setTaskScopeFilter: (value: "all" | TaskScope) => void;
  setTaskPriorityFilter: (value: "all" | TaskPriority) => void;
  setTaskSortBy: (value: "priority" | "dueDate" | "created") => void;
  setInventoryFilter: (value: "all" | "lowStock" | "inStock") => void;
  setInventoryCategoryFilter: (value: "all" | InventoryItemCategory) => void;
  resetFilters: () => void;
}

export const useBeeMindUI = create<BeeMindUIState>((set) => ({
  hiveSearch: "",
  hiveStatusFilter: "All",
  taskFilter: "pending",
  taskScopeFilter: "all",
  taskPriorityFilter: "all",
  taskSortBy: "priority",
  inventoryFilter: "all",
  inventoryCategoryFilter: "all",

  setHiveSearch: (value) => set({ hiveSearch: value }),
  setHiveStatusFilter: (value) => set({ hiveStatusFilter: value }),
  setTaskFilter: (value) => set({ taskFilter: value }),
  setTaskScopeFilter: (value) => set({ taskScopeFilter: value }),
  setTaskPriorityFilter: (value) => set({ taskPriorityFilter: value }),
  setTaskSortBy: (value) => set({ taskSortBy: value }),
  setInventoryFilter: (value) => set({ inventoryFilter: value }),
  setInventoryCategoryFilter: (value) => set({ inventoryCategoryFilter: value }),
  resetFilters: () =>
    set({
      hiveSearch: "",
      hiveStatusFilter: "All",
      taskScopeFilter: "all",
      taskPriorityFilter: "all",
      taskSortBy: "priority",
      inventoryFilter: "all",
      inventoryCategoryFilter: "all",
    }),
}));
