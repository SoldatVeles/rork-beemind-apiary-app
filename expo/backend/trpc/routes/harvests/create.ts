import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const createHarvestProcedure = protectedProcedure
  .input(
    z.object({
      yard_id: z.string().optional(),
      hive_id: z.string().optional(),
      frames_spun: z.number().optional(),
      weight_kg: z.number(),
      moisture_pct: z.number().optional(),
      lot_code: z.string().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("harvest_batches")
      .insert({
        user_id: ctx.userId,
        ...input,
      })
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error creating harvest:", error);
      throw new Error(error.message);
    }

    return data;
  });
