import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const updateYardProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;

    const { data, error } = await ctx.supabase
      .from("yards")
      .update(updates)
      .eq("id", id)
      .eq("user_id", ctx.userId)
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error updating yard:", error);
      throw new Error(error.message);
    }

    return data;
  });
