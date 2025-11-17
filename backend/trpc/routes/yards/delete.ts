import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const deleteYardProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase
      .from("yards")
      .delete()
      .eq("id", input.id)
      .eq("user_id", ctx.userId);

    if (error) {
      console.error("[tRPC] Error deleting yard:", error);
      throw new Error(error.message);
    }

    return { success: true };
  });
