import { useMemo } from "react";
import { useBeeMind } from "@/store/beemind-context";
import type { Hive } from "@/types";

/**
 * Read + mutate hives from the Supabase-backed context.
 * Real data only — no mocks, no local seeds.
 */
export function useHives() {
  const { hives, isLoading, addHive, updateHive, deleteHive, refetch } = useBeeMind();

  return useMemo(
    () => ({
      hives,
      isLoading,
      addHive,
      updateHive,
      deleteHive,
      refetch,
      getById: (id: string): Hive | undefined => hives.find((h) => h.id === id),
      getByYard: (yardId: string): Hive[] => hives.filter((h) => h.yard_id === yardId),
    }),
    [hives, isLoading, addHive, updateHive, deleteHive, refetch]
  );
}
