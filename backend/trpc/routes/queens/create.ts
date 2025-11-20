import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const createQueenProcedure = protectedProcedure
  .input(
    z.object({
      hive_id: z.string().optional(),
      hatch_date: z.string().optional(),
      origin: z.string().optional(),
      mark_color: z.string().optional(),
      temperament: z.number().optional(),
      status: z
        .enum(["Active", "Superseded", "Lost", "Dead", "Missing", "Replaced"])
        .optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("queens")
      .insert({
        user_id: ctx.userId,
        ...input,
        status: input.status || "Active",
      })
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error creating queen:", error);
      throw new Error(error.message);
    }

    return data;
  });
