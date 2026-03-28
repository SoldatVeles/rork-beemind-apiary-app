import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const createYardProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("yards")
      .insert({
        user_id: ctx.userId,
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error creating yard:", error);
      throw new Error(error.message);
    }

    return data;
  });
