import createContextHook from "@nkzw/create-context-hook";
import { useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/store/auth-store";
import type {
  Yard,
  Hive,
  Task,
  Queen,
  Inspection,
  HarvestBatch,
  InventoryItem,
} from "@/types";

export const [BeeMindProvider, useBeeMind] = createContextHook(() => {
  const { isAuthenticated } = useAuth();

  const yardsQuery = trpc.yards.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const hivesQuery = trpc.hives.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tasksQuery = trpc.tasks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const queensQuery = trpc.queens.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const inspectionsQuery = trpc.inspections.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const harvestsQuery = trpc.harvests.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createYardMutation = trpc.yards.create.useMutation({
    onSuccess: () => {
      yardsQuery.refetch();
    },
  });

  const updateYardMutation = trpc.yards.update.useMutation({
    onSuccess: () => {
      yardsQuery.refetch();
    },
  });

  const deleteYardMutation = trpc.yards.delete.useMutation({
    onSuccess: () => {
      yardsQuery.refetch();
      hivesQuery.refetch();
      tasksQuery.refetch();
    },
  });

  const createHiveMutation = trpc.hives.create.useMutation({
    onSuccess: () => {
      hivesQuery.refetch();
    },
  });

  const updateHiveMutation = trpc.hives.update.useMutation({
    onSuccess: () => {
      hivesQuery.refetch();
    },
  });

  const deleteHiveMutation = trpc.hives.delete.useMutation({
    onSuccess: () => {
      hivesQuery.refetch();
      queensQuery.refetch();
      inspectionsQuery.refetch();
      tasksQuery.refetch();
    },
  });

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      tasksQuery.refetch();
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      tasksQuery.refetch();
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      tasksQuery.refetch();
    },
  });

  const createQueenMutation = trpc.queens.create.useMutation({
    onSuccess: () => {
      queensQuery.refetch();
    },
  });

  const createInspectionMutation = trpc.inspections.create.useMutation({
    onSuccess: () => {
      inspectionsQuery.refetch();
    },
  });

  const createHarvestMutation = trpc.harvests.create.useMutation({
    onSuccess: () => {
      harvestsQuery.refetch();
    },
  });

  const createInventoryItemMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      inventoryQuery.refetch();
    },
  });

  const updateInventoryItemMutation = trpc.inventory.update.useMutation({
    onSuccess: () => {
      inventoryQuery.refetch();
    },
  });

  const yards = useMemo(() => yardsQuery.data || [], [yardsQuery.data]);
  const hives = useMemo(() => hivesQuery.data || [], [hivesQuery.data]);
  const tasks = useMemo(() => tasksQuery.data || [], [tasksQuery.data]);
  const queens = useMemo(() => queensQuery.data || [], [queensQuery.data]);
  const inspections = useMemo(
    () => inspectionsQuery.data || [],
    [inspectionsQuery.data]
  );
  const harvests = useMemo(
    () => harvestsQuery.data || [],
    [harvestsQuery.data]
  );
  const inventory = useMemo(
    () => inventoryQuery.data || [],
    [inventoryQuery.data]
  );

  const isLoading = useMemo(
    () =>
      yardsQuery.isLoading ||
      hivesQuery.isLoading ||
      tasksQuery.isLoading ||
      queensQuery.isLoading ||
      inspectionsQuery.isLoading ||
      harvestsQuery.isLoading ||
      inventoryQuery.isLoading,
    [
      yardsQuery.isLoading,
      hivesQuery.isLoading,
      tasksQuery.isLoading,
      queensQuery.isLoading,
      inspectionsQuery.isLoading,
      harvestsQuery.isLoading,
      inventoryQuery.isLoading,
    ]
  );

  const addYard = useCallback(
    (yard: Omit<Yard, "id" | "created_at" | "user_id">) =>
      createYardMutation.mutateAsync(yard),
    [createYardMutation]
  );

  const updateYard = useCallback(
    (id: string, yard: Partial<Yard>) =>
      updateYardMutation.mutateAsync({ id, ...yard }),
    [updateYardMutation]
  );

  const deleteYard = useCallback(
    (id: string) => deleteYardMutation.mutateAsync({ id }),
    [deleteYardMutation]
  );

  const addHive = useCallback(
    (hive: Omit<Hive, "id" | "created_at" | "user_id">) =>
      createHiveMutation.mutateAsync(hive),
    [createHiveMutation]
  );

  const updateHive = useCallback(
    (id: string, hive: Partial<Hive>) =>
      updateHiveMutation.mutateAsync({ id, ...hive }),
    [updateHiveMutation]
  );

  const deleteHive = useCallback(
    (id: string) => deleteHiveMutation.mutateAsync({ id }),
    [deleteHiveMutation]
  );

  const addTask = useCallback(
    (task: Omit<Task, "id" | "created_at" | "user_id">) =>
      createTaskMutation.mutateAsync(task),
    [createTaskMutation]
  );

  const updateTask = useCallback(
    (id: string, task: Partial<Task>) =>
      updateTaskMutation.mutateAsync({ id, ...task }),
    [updateTaskMutation]
  );

  const deleteTask = useCallback(
    (id: string) => deleteTaskMutation.mutateAsync({ id }),
    [deleteTaskMutation]
  );

  const addQueen = useCallback(
    (queen: Omit<Queen, "id" | "created_at" | "user_id">) =>
      createQueenMutation.mutateAsync(queen),
    [createQueenMutation]
  );

  const addInspection = useCallback(
    (inspection: Omit<Inspection, "id" | "user_id">) =>
      createInspectionMutation.mutateAsync(inspection),
    [createInspectionMutation]
  );

  const addHarvest = useCallback(
    (harvest: Omit<HarvestBatch, "id" | "created_at" | "user_id">) =>
      createHarvestMutation.mutateAsync(harvest),
    [createHarvestMutation]
  );

  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, "id" | "created_at" | "user_id">) =>
      createInventoryItemMutation.mutateAsync(item),
    [createInventoryItemMutation]
  );

  const updateInventoryItem = useCallback(
    (id: string, item: Partial<InventoryItem>) =>
      updateInventoryItemMutation.mutateAsync({ id, ...item }),
    [updateInventoryItemMutation]
  );

  const refetch = useCallback(() => {
    yardsQuery.refetch();
    hivesQuery.refetch();
    tasksQuery.refetch();
    queensQuery.refetch();
    inspectionsQuery.refetch();
    harvestsQuery.refetch();
    inventoryQuery.refetch();
  }, [
    yardsQuery,
    hivesQuery,
    tasksQuery,
    queensQuery,
    inspectionsQuery,
    harvestsQuery,
    inventoryQuery,
  ]);

  return useMemo(
    () => ({
      yards,
      hives,
      tasks,
      queens,
      inspections,
      harvests,
      inventory,
      isLoading,
      addYard,
      updateYard,
      deleteYard,
      addHive,
      updateHive,
      deleteHive,
      addTask,
      updateTask,
      deleteTask,
      addQueen,
      addInspection,
      addHarvest,
      addInventoryItem,
      updateInventoryItem,
      refetch,
    }),
    [
      yards,
      hives,
      tasks,
      queens,
      inspections,
      harvests,
      inventory,
      isLoading,
      addYard,
      updateYard,
      deleteYard,
      addHive,
      updateHive,
      deleteHive,
      addTask,
      updateTask,
      deleteTask,
      addQueen,
      addInspection,
      addHarvest,
      addInventoryItem,
      updateInventoryItem,
      refetch,
    ]
  );
});
