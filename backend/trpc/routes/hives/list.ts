import { protectedProcedure } from "../../create-context";

export const listHivesProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("hives")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tRPC] Error fetching hives:", error);
    throw new Error(error.message);
  }

  return data || [];
});
