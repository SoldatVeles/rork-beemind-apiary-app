import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const updateInventoryItemProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      min_quantity: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;

    const { data, error } = await ctx.supabase
      .from("inventory")
      .update(updates)
      .eq("id", id)
      .eq("user_id", ctx.userId)
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error updating inventory item:", error);
      throw new Error(error.message);
    }

    return data;
  });
