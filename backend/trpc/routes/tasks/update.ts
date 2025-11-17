import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const updateTaskProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      due_at: z.string().optional(),
      priority: z.number().optional(),
      is_done: z.boolean().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;

    const { data, error } = await ctx.supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", ctx.userId)
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error updating task:", error);
      throw new Error(error.message);
    }

    return data;
  });
