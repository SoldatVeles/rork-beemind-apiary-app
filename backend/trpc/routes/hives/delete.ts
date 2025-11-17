import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const deleteHiveProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase
      .from("hives")
      .delete()
      .eq("id", input.id)
      .eq("user_id", ctx.userId);

    if (error) {
      console.error("[tRPC] Error deleting hive:", error);
      throw new Error(error.message);
    }

    return { success: true };
  });
