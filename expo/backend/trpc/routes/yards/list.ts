import { protectedProcedure } from "../../create-context";

export const listYardsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("yards")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tRPC] Error fetching yards:", error);
    throw new Error(error.message);
  }

  return data || [];
});
