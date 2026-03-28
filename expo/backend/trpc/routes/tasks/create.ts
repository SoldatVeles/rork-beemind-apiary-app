import { protectedProcedure } from "../../create-context";
import { z } from "zod";

export const createTaskProcedure = protectedProcedure
  .input(
    z.object({
      scope: z.enum(["org", "yard", "hive"]),
      yard_id: z.string().optional(),
      hive_id: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      due_at: z.string().optional(),
      priority: z.number().optional(),
      is_done: z.boolean().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("tasks")
      .insert({
        user_id: ctx.userId,
        scope: input.scope,
        yard_id: input.yard_id,
        hive_id: input.hive_id,
        title: input.title,
        description: input.description,
        due_at: input.due_at,
        priority: input.priority || 2,
        is_done: input.is_done || false,
      })
      .select()
      .single();

    if (error) {
      console.error("[tRPC] Error creating task:", error);
      throw new Error(error.message);
    }

    return data;
  });
