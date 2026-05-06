import { useMemo } from "react";
import { useBeeMind } from "@/store/beemind-context";
import type { Task } from "@/types";

/**
 * Read + mutate tasks from the Supabase-backed context.
 */
export function useTasks() {
  const { tasks, isLoading, addTask, updateTask, deleteTask, refetch } = useBeeMind();

  return useMemo(
    () => ({
      tasks,
      isLoading,
      addTask,
      updateTask,
      deleteTask,
      refetch,
      pending: tasks.filter((t) => !t.is_done),
      completed: tasks.filter((t) => t.is_done),
      getByHive: (hiveId: string): Task[] => tasks.filter((t) => t.hive_id === hiveId),
      getByYard: (yardId: string): Task[] => tasks.filter((t) => t.yard_id === yardId),
    }),
    [tasks, isLoading, addTask, updateTask, deleteTask, refetch]
  );
}
