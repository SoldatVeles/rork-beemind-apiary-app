import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const createInventoryItemProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      category: z.enum(["equipment", "feed", "medication", "packaging", "other"]),
      quantity: z.number(),
      unit: z.string(),
      min_quantity: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("inventory")
      .insert({
        user_id: ctx.userId,
        ...input,
      })
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error creating inventory item:", error);
      throw new Error(error.message);
    }

    return data;
  });
