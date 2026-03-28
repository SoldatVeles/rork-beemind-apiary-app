import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const createHiveProcedure = protectedProcedure
  .input(
    z.object({
      yard_id: z.string(),
      label: z.string(),
      hive_type: z.string().optional(),
      frames: z.number().optional(),
      status: z
        .enum(["Active", "Split", "Deadout", "Queenless", "Weak", "Dead", "Sold"])
        .optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("hives")
      .insert({
        user_id: ctx.userId,
        yard_id: input.yard_id,
        label: input.label,
        hive_type: input.hive_type,
        frames: input.frames,
        status: input.status || "Active",
        latitude: input.latitude,
        longitude: input.longitude,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error creating hive:", error);
      throw new Error(error.message);
    }

    return data;
  });
