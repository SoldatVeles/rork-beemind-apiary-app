import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const createInspectionProcedure = protectedProcedure
  .input(
    z.object({
      hive_id: z.string(),
      performed_at: z.string(),
      brood_pattern: z.enum(["none", "spotty", "solid"]).optional(),
      eggs_seen: z.boolean().optional(),
      larvae_seen: z.boolean().optional(),
      stores_kg: z.number().optional(),
      mites_per_100: z.number().optional(),
      temper: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("inspections")
      .insert({
        user_id: ctx.userId,
        ...input,
      })
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error creating inspection:", error);
      throw new Error(error.message);
    }

    return data;
  });
