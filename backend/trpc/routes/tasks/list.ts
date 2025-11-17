import { protectedProcedure } from "../../create-context";

export const listTasksProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("tasks")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("due_at", { ascending: true });

  if (error) {
    console.error("[tRPC] Error fetching tasks:", error);
    throw new Error(error.message);
  }

  return data || [];
});
