import { useMemo } from "react";
import { useBeeMind } from "@/store/beemind-context";
import type { Yard } from "@/types";

/**
 * Read + mutate yards from the Supabase-backed context.
 */
export function useYards() {
  const { yards, isLoading, addYard, updateYard, deleteYard, refetch } = useBeeMind();

  return useMemo(
    () => ({
      yards,
      isLoading,
      addYard,
      updateYard,
      deleteYard,
      refetch,
      getById: (id: string): Yard | undefined => yards.find((y) => y.id === id),
    }),
    [yards, isLoading, addYard, updateYard, deleteYard, refetch]
  );
}
