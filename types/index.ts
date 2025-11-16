export type HiveStatus = "Active" | "Split" | "Deadout";
export type QueenStatus = "Active" | "Superseded" | "Lost" | "Dead";
export type BroodPattern = "solid" | "spotty" | "none";
export type TaskScope = "org" | "yard" | "hive";
export type TaskPriority = 1 | 2 | 3;
export type DeviceType = "scale" | "temp" | "humidity" | "co2" | "mic";

export interface Yard {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  elevation_m?: number;
  notes?: string;
  created_at: string;
}

export interface Hive {
  id: string;
  yard_id: string;
  label: string;
  hive_type: string;
  frames: number;
  status: HiveStatus;
  latitude?: number;
  longitude?: number;
  notes?: string;
  qr_code?: string;
  created_at: string;
}

export interface Queen {
  id: string;
  hive_id?: string;
  hatch_date?: string;
  origin?: string;
  mark_color?: string;
  temperament?: number;
  status: QueenStatus;
  notes?: string;
  created_at: string;
}

export interface Inspection {
  id: string;
  hive_id: string;
  performed_at: string;
  brood_pattern?: BroodPattern;
  eggs_seen?: boolean;
  larvae_seen?: boolean;
  stores_kg?: number;
  mites_per_100?: number;
  temper?: number;
  supers_delta?: number;
  notes?: string;
  weather_json?: Record<string, unknown>;
  created_by?: string;
}

export interface Task {
  id: string;
  scope: TaskScope;
  yard_id?: string;
  hive_id?: string;
  title: string;
  notes?: string;
  due_at?: string;
  recurrence?: string;
  priority: TaskPriority;
  assignee?: string;
  is_done: boolean;
  completed_at?: string;
  created_at: string;
}

export interface HarvestBatch {
  id: string;
  yard_id?: string;
  hive_id?: string;
  frames_spun: number;
  weight_kg: number;
  moisture_pct?: number;
  lot_code?: string;
  notes?: string;
  created_at: string;
}

export interface Device {
  id: string;
  device_type: DeviceType;
  hive_id?: string;
  name: string;
  firmware?: string;
  calibration?: Record<string, unknown>;
  created_at: string;
}

export interface SensorReading {
  id: string;
  device_id: string;
  hive_id?: string;
  ts: string;
  kind: string;
  value: number;
  unit: string;
}

export interface Treatment {
  id: string;
  hive_id: string;
  product: string;
  dose?: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}

export type InventoryItemCategory = "equipment" | "feed" | "medication" | "packaging" | "other";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  quantity: number;
  unit: string;
  min_quantity?: number;
  notes?: string;
  created_at: string;
}
