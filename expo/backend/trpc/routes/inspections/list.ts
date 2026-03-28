import { protectedProcedure } from "../../create-context";

export const listInspectionsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("inspections")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("performed_at", { ascending: false });

  if (error) {
    console.error("[tRPC] Error fetching inspections:", error);
    throw new Error(error.message);
  }

  return data || [];
});
