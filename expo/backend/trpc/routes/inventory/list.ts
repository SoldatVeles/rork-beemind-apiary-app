import { protectedProcedure } from "../../create-context";

export const listInventoryProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("inventory")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tRPC] Error fetching inventory:", error);
    throw new Error(error.message);
  }

  return data || [];
});
