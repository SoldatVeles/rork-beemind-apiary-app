import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth-store";
import type {
  Yard,
  Hive,
  Task,
  Queen,
  Inspection,
  HarvestBatch,
  InventoryItem,
  Device,
  SensorReading,
  Treatment,
} from "@/types";

const TABLES = {
  yards: "yards",
  hives: "hives",
  tasks: "tasks",
  queens: "queens",
  inspections: "inspections",
  harvests: "harvests",
  inventory: "inventory_items",
  devices: "devices",
  sensorReadings: "sensor_readings",
  treatments: "treatments",
} as const;

async function fetchTable<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.warn(`[BeeMind] Failed to fetch ${table}:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export const [BeeMindProvider, useBeeMind] = createContextHook(() => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const enabled = isAuthenticated;

  const yardsQuery = useQuery<Yard[]>({
    queryKey: ["yards", userId],
    queryFn: () => fetchTable<Yard>(TABLES.yards),
    enabled,
  });
  const hivesQuery = useQuery<Hive[]>({
    queryKey: ["hives", userId],
    queryFn: () => fetchTable<Hive>(TABLES.hives),
    enabled,
  });
  const tasksQuery = useQuery<Task[]>({
    queryKey: ["tasks", userId],
    queryFn: () => fetchTable<Task>(TABLES.tasks),
    enabled,
  });
  const queensQuery = useQuery<Queen[]>({
    queryKey: ["queens", userId],
    queryFn: () => fetchTable<Queen>(TABLES.queens),
    enabled,
  });
  const inspectionsQuery = useQuery<Inspection[]>({
    queryKey: ["inspections", userId],
    queryFn: () => fetchTable<Inspection>(TABLES.inspections),
    enabled,
  });
  const harvestsQuery = useQuery<HarvestBatch[]>({
    queryKey: ["harvests", userId],
    queryFn: () => fetchTable<HarvestBatch>(TABLES.harvests),
    enabled,
  });
  const inventoryQuery = useQuery<InventoryItem[]>({
    queryKey: ["inventory", userId],
    queryFn: () => fetchTable<InventoryItem>(TABLES.inventory),
    enabled,
  });
  const devicesQuery = useQuery<Device[]>({
    queryKey: ["devices", userId],
    queryFn: () => fetchTable<Device>(TABLES.devices),
    enabled,
  });
  const sensorReadingsQuery = useQuery<SensorReading[]>({
    queryKey: ["sensorReadings", userId],
    queryFn: () => fetchTable<SensorReading>(TABLES.sensorReadings),
    enabled,
  });
  const treatmentsQuery = useQuery<Treatment[]>({
    queryKey: ["treatments", userId],
    queryFn: () => fetchTable<Treatment>(TABLES.treatments),
    enabled,
  });

  const invalidate = useCallback(
    (keys: string[]) => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    },
    [queryClient]
  );

  const insertRow = useCallback(
    async <T extends Record<string, unknown>>(
      table: string,
      values: T
    ): Promise<T & { id: string }> => {
      const payload = userId ? { ...values, user_id: userId } : values;
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error(`[BeeMind] insert ${table} failed:`, error.message);
        throw error;
      }
      return data as T & { id: string };
    },
    [userId]
  );

  const updateRow = useCallback(
    async (table: string, id: string, values: Record<string, unknown>) => {
      const { error } = await supabase.from(table).update(values).eq("id", id);
      if (error) {
        console.error(`[BeeMind] update ${table} failed:`, error.message);
        throw error;
      }
    },
    []
  );

  const deleteRow = useCallback(
    async (table: string, id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        console.error(`[BeeMind] delete ${table} failed:`, error.message);
        throw error;
      }
    },
    []
  );

  // Yards
  const createYardMutation = useMutation({
    mutationFn: (yard: Omit<Yard, "id" | "created_at">) =>
      insertRow<Omit<Yard, "id" | "created_at">>(TABLES.yards, yard),
    onSuccess: () => invalidate(["yards"]),
  });
  const updateYardMutation = useMutation({
    mutationFn: ({ id, ...values }: { id: string } & Partial<Yard>) =>
      updateRow(TABLES.yards, id, values),
    onSuccess: () => invalidate(["yards"]),
  });
  const deleteYardMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.yards, id),
    onSuccess: () => invalidate(["yards", "hives", "tasks"]),
  });

  // Hives
  const createHiveMutation = useMutation({
    mutationFn: (hive: Omit<Hive, "id" | "created_at">) =>
      insertRow<Omit<Hive, "id" | "created_at">>(TABLES.hives, hive),
    onSuccess: () => invalidate(["hives"]),
  });
  const updateHiveMutation = useMutation({
    mutationFn: ({ id, ...values }: { id: string } & Partial<Hive>) =>
      updateRow(TABLES.hives, id, values),
    onSuccess: () => invalidate(["hives"]),
  });
  const deleteHiveMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.hives, id),
    onSuccess: () => invalidate(["hives", "queens", "inspections", "tasks"]),
  });

  // Tasks
  const createTaskMutation = useMutation({
    mutationFn: (task: Omit<Task, "id" | "created_at">) =>
      insertRow<Omit<Task, "id" | "created_at">>(TABLES.tasks, task),
    onSuccess: () => invalidate(["tasks"]),
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...values }: { id: string } & Partial<Task>) =>
      updateRow(TABLES.tasks, id, values),
    onSuccess: () => invalidate(["tasks"]),
  });
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.tasks, id),
    onSuccess: () => invalidate(["tasks"]),
  });

  // Queens
  const createQueenMutation = useMutation({
    mutationFn: (queen: Omit<Queen, "id" | "created_at">) =>
      insertRow<Omit<Queen, "id" | "created_at">>(TABLES.queens, queen),
    onSuccess: () => invalidate(["queens"]),
  });
  const updateQueenMutation = useMutation({
    mutationFn: ({ id, ...values }: { id: string } & Partial<Queen>) =>
      updateRow(TABLES.queens, id, values),
    onSuccess: () => invalidate(["queens"]),
  });
  const deleteQueenMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.queens, id),
    onSuccess: () => invalidate(["queens"]),
  });

  // Inspections
  const createInspectionMutation = useMutation({
    mutationFn: (inspection: Omit<Inspection, "id">) =>
      insertRow<Omit<Inspection, "id">>(TABLES.inspections, inspection),
    onSuccess: () => invalidate(["inspections"]),
  });
  const deleteInspectionMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.inspections, id),
    onSuccess: () => invalidate(["inspections"]),
  });

  // Harvests
  const createHarvestMutation = useMutation({
    mutationFn: (harvest: Omit<HarvestBatch, "id" | "created_at">) =>
      insertRow<Omit<HarvestBatch, "id" | "created_at">>(TABLES.harvests, harvest),
    onSuccess: () => invalidate(["harvests"]),
  });
  const deleteHarvestMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.harvests, id),
    onSuccess: () => invalidate(["harvests"]),
  });

  // Inventory
  const createInventoryItemMutation = useMutation({
    mutationFn: (item: Omit<InventoryItem, "id" | "created_at">) =>
      insertRow<Omit<InventoryItem, "id" | "created_at">>(TABLES.inventory, item),
    onSuccess: () => invalidate(["inventory"]),
  });
  const updateInventoryItemMutation = useMutation({
    mutationFn: ({ id, ...values }: { id: string } & Partial<InventoryItem>) =>
      updateRow(TABLES.inventory, id, values),
    onSuccess: () => invalidate(["inventory"]),
  });
  const deleteInventoryItemMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.inventory, id),
    onSuccess: () => invalidate(["inventory"]),
  });

  // Devices
  const createDeviceMutation = useMutation({
    mutationFn: (device: Omit<Device, "id" | "created_at">) =>
      insertRow<Omit<Device, "id" | "created_at">>(TABLES.devices, device),
    onSuccess: () => invalidate(["devices"]),
  });
  const deleteDeviceMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.devices, id),
    onSuccess: () => invalidate(["devices", "sensorReadings"]),
  });

  // Treatments
  const createTreatmentMutation = useMutation({
    mutationFn: (treatment: Omit<Treatment, "id" | "created_at">) =>
      insertRow<Omit<Treatment, "id" | "created_at">>(TABLES.treatments, treatment),
    onSuccess: () => invalidate(["treatments"]),
  });
  const deleteTreatmentMutation = useMutation({
    mutationFn: (id: string) => deleteRow(TABLES.treatments, id),
    onSuccess: () => invalidate(["treatments"]),
  });

  const yards = useMemo<Yard[]>(() => yardsQuery.data ?? [], [yardsQuery.data]);
  const hives = useMemo<Hive[]>(() => hivesQuery.data ?? [], [hivesQuery.data]);
  const tasks = useMemo<Task[]>(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const queens = useMemo<Queen[]>(() => queensQuery.data ?? [], [queensQuery.data]);
  const inspections = useMemo<Inspection[]>(() => inspectionsQuery.data ?? [], [inspectionsQuery.data]);
  const harvests = useMemo<HarvestBatch[]>(() => harvestsQuery.data ?? [], [harvestsQuery.data]);
  const inventory = useMemo<InventoryItem[]>(() => inventoryQuery.data ?? [], [inventoryQuery.data]);
  const devices = useMemo<Device[]>(() => devicesQuery.data ?? [], [devicesQuery.data]);
  const sensorReadings = useMemo<SensorReading[]>(() => sensorReadingsQuery.data ?? [], [sensorReadingsQuery.data]);
  const treatments = useMemo<Treatment[]>(() => treatmentsQuery.data ?? [], [treatmentsQuery.data]);

  const isLoading =
    yardsQuery.isLoading ||
    hivesQuery.isLoading ||
    tasksQuery.isLoading ||
    queensQuery.isLoading ||
    inspectionsQuery.isLoading ||
    harvestsQuery.isLoading ||
    inventoryQuery.isLoading;

  const addYard = useCallback(
    (yard: Omit<Yard, "id" | "created_at">) => createYardMutation.mutateAsync(yard),
    [createYardMutation]
  );
  const updateYard = useCallback(
    (id: string, yard: Partial<Yard>) => updateYardMutation.mutateAsync({ id, ...yard }),
    [updateYardMutation]
  );
  const deleteYard = useCallback(
    (id: string) => deleteYardMutation.mutateAsync(id),
    [deleteYardMutation]
  );

  const addHive = useCallback(
    (hive: Omit<Hive, "id" | "created_at">) => createHiveMutation.mutateAsync(hive),
    [createHiveMutation]
  );
  const updateHive = useCallback(
    (id: string, hive: Partial<Hive>) => updateHiveMutation.mutateAsync({ id, ...hive }),
    [updateHiveMutation]
  );
  const deleteHive = useCallback(
    (id: string) => deleteHiveMutation.mutateAsync(id),
    [deleteHiveMutation]
  );

  const addTask = useCallback(
    (task: Omit<Task, "id" | "created_at">) => createTaskMutation.mutateAsync(task),
    [createTaskMutation]
  );
  const updateTask = useCallback(
    (id: string, task: Partial<Task>) => updateTaskMutation.mutateAsync({ id, ...task }),
    [updateTaskMutation]
  );
  const deleteTask = useCallback(
    (id: string) => deleteTaskMutation.mutateAsync(id),
    [deleteTaskMutation]
  );

  const addQueen = useCallback(
    (queen: Omit<Queen, "id" | "created_at">) => createQueenMutation.mutateAsync(queen),
    [createQueenMutation]
  );
  const updateQueen = useCallback(
    (id: string, queen: Partial<Queen>) => updateQueenMutation.mutateAsync({ id, ...queen }),
    [updateQueenMutation]
  );
  const deleteQueen = useCallback(
    (id: string) => deleteQueenMutation.mutateAsync(id),
    [deleteQueenMutation]
  );

  const addInspection = useCallback(
    (inspection: Omit<Inspection, "id">) => createInspectionMutation.mutateAsync(inspection),
    [createInspectionMutation]
  );
  const deleteInspection = useCallback(
    (id: string) => deleteInspectionMutation.mutateAsync(id),
    [deleteInspectionMutation]
  );

  const addHarvest = useCallback(
    (harvest: Omit<HarvestBatch, "id" | "created_at">) =>
      createHarvestMutation.mutateAsync(harvest),
    [createHarvestMutation]
  );
  const deleteHarvest = useCallback(
    (id: string) => deleteHarvestMutation.mutateAsync(id),
    [deleteHarvestMutation]
  );

  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, "id" | "created_at">) =>
      createInventoryItemMutation.mutateAsync(item),
    [createInventoryItemMutation]
  );
  const updateInventoryItem = useCallback(
    (id: string, item: Partial<InventoryItem>) =>
      updateInventoryItemMutation.mutateAsync({ id, ...item }),
    [updateInventoryItemMutation]
  );
  const deleteInventoryItem = useCallback(
    (id: string) => deleteInventoryItemMutation.mutateAsync(id),
    [deleteInventoryItemMutation]
  );

  const addDevice = useCallback(
    (device: Omit<Device, "id" | "created_at">) => createDeviceMutation.mutateAsync(device),
    [createDeviceMutation]
  );
  const deleteDevice = useCallback(
    (id: string) => deleteDeviceMutation.mutateAsync(id),
    [deleteDeviceMutation]
  );

  const addTreatment = useCallback(
    (treatment: Omit<Treatment, "id" | "created_at">) =>
      createTreatmentMutation.mutateAsync(treatment),
    [createTreatmentMutation]
  );
  const deleteTreatment = useCallback(
    (id: string) => deleteTreatmentMutation.mutateAsync(id),
    [deleteTreatmentMutation]
  );

  const refetch = useCallback(() => {
    yardsQuery.refetch();
    hivesQuery.refetch();
    tasksQuery.refetch();
    queensQuery.refetch();
    inspectionsQuery.refetch();
    harvestsQuery.refetch();
    inventoryQuery.refetch();
    devicesQuery.refetch();
    sensorReadingsQuery.refetch();
    treatmentsQuery.refetch();
  }, [
    yardsQuery,
    hivesQuery,
    tasksQuery,
    queensQuery,
    inspectionsQuery,
    harvestsQuery,
    inventoryQuery,
    devicesQuery,
    sensorReadingsQuery,
    treatmentsQuery,
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
      devices,
      sensorReadings,
      treatments,
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
      updateQueen,
      deleteQueen,
      addInspection,
      deleteInspection,
      addHarvest,
      deleteHarvest,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addDevice,
      deleteDevice,
      addTreatment,
      deleteTreatment,
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
      devices,
      sensorReadings,
      treatments,
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
      updateQueen,
      deleteQueen,
      addInspection,
      deleteInspection,
      addHarvest,
      deleteHarvest,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addDevice,
      deleteDevice,
      addTreatment,
      deleteTreatment,
      refetch,
    ]
  );
});
