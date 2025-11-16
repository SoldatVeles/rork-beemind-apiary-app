import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Device,
  HarvestBatch,
  Hive,
  Inspection,
  InventoryItem,
  Queen,
  SensorReading,
  Task,
  Treatment,
  Yard,
} from "../types";

interface BeeMindState {
  yards: Yard[];
  hives: Hive[];
  queens: Queen[];
  inspections: Inspection[];
  tasks: Task[];
  harvests: HarvestBatch[];
  devices: Device[];
  sensorReadings: SensorReading[];
  treatments: Treatment[];
  inventory: InventoryItem[];

  addYard: (yard: Omit<Yard, "id" | "created_at">) => string;
  updateYard: (id: string, yard: Partial<Yard>) => void;
  deleteYard: (id: string) => void;

  addHive: (hive: Omit<Hive, "id" | "created_at">) => void;
  updateHive: (id: string, hive: Partial<Hive>) => void;
  deleteHive: (id: string) => void;

  addQueen: (queen: Omit<Queen, "id" | "created_at">) => void;
  updateQueen: (id: string, queen: Partial<Queen>) => void;
  deleteQueen: (id: string) => void;

  addInspection: (inspection: Omit<Inspection, "id">) => void;
  updateInspection: (id: string, inspection: Partial<Inspection>) => void;
  deleteInspection: (id: string) => void;

  addTask: (task: Omit<Task, "id" | "created_at">) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addHarvest: (harvest: Omit<HarvestBatch, "id" | "created_at">) => void;
  updateHarvest: (id: string, harvest: Partial<HarvestBatch>) => void;
  deleteHarvest: (id: string) => void;

  addDevice: (device: Omit<Device, "id" | "created_at">) => void;
  updateDevice: (id: string, device: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  addSensorReading: (reading: Omit<SensorReading, "id">) => void;

  addTreatment: (treatment: Omit<Treatment, "id" | "created_at">) => void;
  updateTreatment: (id: string, treatment: Partial<Treatment>) => void;
  deleteTreatment: (id: string) => void;

  addInventoryItem: (item: Omit<InventoryItem, "id" | "created_at">) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  loadSeedData: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useBeeMindStore = create<BeeMindState>()(
  persist(
    (set) => ({
      yards: [],
      hives: [],
      queens: [],
      inspections: [],
      tasks: [],
      harvests: [],
      devices: [],
      sensorReadings: [],
      treatments: [],
      inventory: [],

      addYard: (yard) => {
        const newYard = {
          ...yard,
          id: generateId(),
          created_at: new Date().toISOString(),
        } satisfies Yard;

        set((state) => ({
          yards: [...state.yards, newYard],
        }));

        return newYard.id;
      },

      updateYard: (id, yard) =>
        set((state) => ({
          yards: state.yards.map((y) => (y.id === id ? { ...y, ...yard } : y)),
        })),

      deleteYard: (id) =>
        set((state) => {
          const hiveIds = state.hives.filter((hive) => hive.yard_id === id).map((hive) => hive.id);
          const deviceIds = state.devices
            .filter((device) => device.hive_id && hiveIds.includes(device.hive_id))
            .map((device) => device.id);

          return {
            yards: state.yards.filter((yard) => yard.id !== id),
            hives: state.hives.filter((hive) => hive.yard_id !== id),
            queens: state.queens.filter((queen) => !queen.hive_id || !hiveIds.includes(queen.hive_id)),
            inspections: state.inspections.filter((inspection) => !hiveIds.includes(inspection.hive_id)),
            tasks: state.tasks.filter(
              (task) => task.yard_id !== id && (!task.hive_id || !hiveIds.includes(task.hive_id))
            ),
            harvests: state.harvests.filter(
              (harvest) => harvest.yard_id !== id && (!harvest.hive_id || !hiveIds.includes(harvest.hive_id))
            ),
            treatments: state.treatments.filter((treatment) => !hiveIds.includes(treatment.hive_id)),
            devices: state.devices.filter((device) => !deviceIds.includes(device.id)),
            sensorReadings: state.sensorReadings.filter(
              (reading) =>
                !deviceIds.includes(reading.device_id) && (!reading.hive_id || !hiveIds.includes(reading.hive_id))
            ),
          };
        }),

      addHive: (hive) =>
        set((state) => ({
          hives: [
            ...state.hives,
            { ...hive, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      updateHive: (id, hive) =>
        set((state) => ({
          hives: state.hives.map((h) => (h.id === id ? { ...h, ...hive } : h)),
        })),

      deleteHive: (id) =>
        set((state) => {
          const deviceIds = state.devices
            .filter((device) => device.hive_id === id)
            .map((device) => device.id);

          return {
            hives: state.hives.filter((hive) => hive.id !== id),
            inspections: state.inspections.filter((inspection) => inspection.hive_id !== id),
            tasks: state.tasks.filter((task) => task.hive_id !== id),
            queens: state.queens.filter((queen) => queen.hive_id !== id),
            harvests: state.harvests.filter((harvest) => harvest.hive_id !== id),
            treatments: state.treatments.filter((treatment) => treatment.hive_id !== id),
            devices: state.devices.filter((device) => device.hive_id !== id),
            sensorReadings: state.sensorReadings.filter(
              (reading) => reading.hive_id !== id && !deviceIds.includes(reading.device_id)
            ),
          };
        }),

      addQueen: (queen) =>
        set((state) => ({
          queens: [
            ...state.queens,
            { ...queen, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      updateQueen: (id, queen) =>
        set((state) => ({
          queens: state.queens.map((q) => (q.id === id ? { ...q, ...queen } : q)),
        })),

      deleteQueen: (id) =>
        set((state) => ({
          queens: state.queens.filter((q) => q.id !== id),
        })),

      addInspection: (inspection) =>
        set((state) => ({
          inspections: [...state.inspections, { ...inspection, id: generateId() }],
        })),

      updateInspection: (id, inspection) =>
        set((state) => ({
          inspections: state.inspections.map((i) =>
            i.id === id ? { ...i, ...inspection } : i
          ),
        })),

      deleteInspection: (id) =>
        set((state) => ({
          inspections: state.inspections.filter((i) => i.id !== id),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      updateTask: (id, task) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addHarvest: (harvest) =>
        set((state) => ({
          harvests: [
            ...state.harvests,
            { ...harvest, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      updateHarvest: (id, harvest) =>
        set((state) => ({
          harvests: state.harvests.map((h) => (h.id === id ? { ...h, ...harvest } : h)),
        })),

      deleteHarvest: (id) =>
        set((state) => ({
          harvests: state.harvests.filter((h) => h.id !== id),
        })),

      addDevice: (device) =>
        set((state) => ({
          devices: [
            ...state.devices,
            { ...device, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      updateDevice: (id, device) =>
        set((state) => ({
          devices: state.devices.map((d) => (d.id === id ? { ...d, ...device } : d)),
        })),

      deleteDevice: (id) =>
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== id),
          sensorReadings: state.sensorReadings.filter((r) => r.device_id !== id),
        })),

      addSensorReading: (reading) =>
        set((state) => ({
          sensorReadings: [...state.sensorReadings, { ...reading, id: generateId() }],
        })),

      addTreatment: (treatment) =>
        set((state) => ({
          treatments: [
            ...state.treatments,
            { ...treatment, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      updateTreatment: (id, treatment) =>
        set((state) => ({
          treatments: state.treatments.map((t) => (t.id === id ? { ...t, ...treatment } : t)),
        })),

      deleteTreatment: (id) =>
        set((state) => ({
          treatments: state.treatments.filter((t) => t.id !== id),
        })),

      addInventoryItem: (item) =>
        set((state) => ({
          inventory: [
            ...state.inventory,
            { ...item, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      updateInventoryItem: (id, item) =>
        set((state) => ({
          inventory: state.inventory.map((i) => (i.id === id ? { ...i, ...item } : i)),
        })),

      deleteInventoryItem: (id) =>
        set((state) => ({
          inventory: state.inventory.filter((i) => i.id !== id),
        })),

      loadSeedData: () =>
        set(() => {
          const now = new Date().toISOString();
          const yesterday = new Date(Date.now() - 86400000).toISOString();
          const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

          const yard1 = { id: "yard-1", name: "North Field", address: "Valenzuela", created_at: now };
          const yard2 = { id: "yard-2", name: "River Yard", address: "Bern", latitude: 46.948, longitude: 7.447, created_at: now };

          const hive1 = { id: "hive-1", yard_id: "yard-1", label: "Hive 1", hive_type: "Langstroth", frames: 10, status: "Active" as const, latitude: 40.7128, longitude: -74.006, created_at: now };
          const hive2 = { id: "hive-2", yard_id: "yard-1", label: "Hive 2", hive_type: "Langstroth", frames: 10, status: "Active" as const, created_at: now };
          const hive3 = { id: "hive-3", yard_id: "yard-2", label: "River Queen", hive_type: "Langstroth", frames: 8, status: "Active" as const, latitude: 46.948, longitude: 7.447, created_at: now };

          const queen1 = { id: "queen-1", hive_id: "hive-1", hatch_date: "2024-04-15", origin: "Local Breeder", mark_color: "Blue", temperament: 4, status: "Active" as const, created_at: now };
          const queen2 = { id: "queen-2", hive_id: "hive-2", hatch_date: "2024-05-20", origin: "Italian Stock", mark_color: "Yellow", temperament: 5, status: "Active" as const, created_at: now };

          const inspection1 = { id: "insp-1", hive_id: "hive-1", performed_at: yesterday, brood_pattern: "solid" as const, eggs_seen: true, larvae_seen: true, stores_kg: 15, mites_per_100: 2, temper: 4, notes: "Strong colony, good brood pattern" };
          const inspection2 = { id: "insp-2", hive_id: "hive-2", performed_at: weekAgo, brood_pattern: "spotty" as const, eggs_seen: true, larvae_seen: true, stores_kg: 12, mites_per_100: 5, temper: 3, notes: "Needs monitoring" };

          const task1 = { id: "task-1", scope: "hive" as const, hive_id: "hive-2", title: "Check for queen cells", due_at: new Date(Date.now() + 2 * 86400000).toISOString(), priority: 1 as const, is_done: false, created_at: now };
          const task2 = { id: "task-2", scope: "yard" as const, yard_id: "yard-1", title: "Mow grass around hives", due_at: new Date(Date.now() + 5 * 86400000).toISOString(), priority: 2 as const, is_done: false, created_at: now };
          const task3 = { id: "task-3", scope: "org" as const, title: "Order new frames", due_at: new Date(Date.now() + 10 * 86400000).toISOString(), priority: 3 as const, is_done: false, created_at: now };

          const harvest1 = { id: "harv-1", yard_id: "yard-1", hive_id: "hive-1", frames_spun: 8, weight_kg: 24, moisture_pct: 17.5, lot_code: "2025-001", notes: "Light amber, excellent quality", created_at: weekAgo };

          const inv1 = { id: "inv-1", name: "Frames", category: "equipment" as const, quantity: 50, unit: "pieces", min_quantity: 10, created_at: now };
          const inv2 = { id: "inv-2", name: "Sugar Syrup", category: "feed" as const, quantity: 5, unit: "liters", min_quantity: 15, created_at: now };
          const inv3 = { id: "inv-3", name: "Varroa Treatment", category: "medication" as const, quantity: 20, unit: "strips", min_quantity: 10, created_at: now };

          return {
            yards: [yard1, yard2],
            hives: [hive1, hive2, hive3],
            queens: [queen1, queen2],
            inspections: [inspection1, inspection2],
            tasks: [task1, task2, task3],
            harvests: [harvest1],
            devices: [],
            sensorReadings: [],
            treatments: [],
            inventory: [inv1, inv2, inv3],
          };
        }),
    }),
    {
      name: "beemind-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
