import { protectedProcedure } from "../../create-context";

export const listHarvestsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("harvest_batches")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tRPC] Error fetching harvests:", error);
    throw new Error(error.message);
  }

  return data || [];
});
