import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const updateHiveProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      yard_id: z.string().optional(),
      label: z.string().optional(),
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
    const { id, ...updates } = input;

    const { data, error } = await ctx.supabase
      .from("hives")
      .update(updates)
      .eq("id", id)
      .eq("user_id", ctx.userId)
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error updating hive:", error);
      throw new Error(error.message);
    }

    return data;
  });
