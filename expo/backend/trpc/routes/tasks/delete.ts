import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const deleteTaskProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase
      .from("tasks")
      .delete()
      .eq("id", input.id)
      .eq("user_id", ctx.userId);

    if (error) {
      console.error("[tRPC] Error deleting task:", error);
      throw new Error(error.message);
    }

    return { success: true };
  });
