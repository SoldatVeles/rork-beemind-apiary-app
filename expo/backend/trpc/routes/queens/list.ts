import { protectedProcedure } from "../../create-context";

export const listQueensProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data, error } = await ctx.supabase
    .from("queens")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tRPC] Error fetching queens:", error);
    throw new Error(error.message);
  }

  return data || [];
});
