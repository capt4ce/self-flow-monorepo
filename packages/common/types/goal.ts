import { z } from "zod";

export const GoalCategory = z.enum([
  "Main",
  "Yearly",
  "Quarterly",
  "Monthly",
  "Weekly",
  "Daily",
]);
export type GoalCategory = z.infer<typeof GoalCategory>;

export const GoalStatus = z.enum(["active", "done"]);
export type GoalStatus = z.infer<typeof GoalStatus>;

export const GoalDTO = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: GoalCategory,
  status: GoalStatus,
  startDate: z.string().date().nullable(),
  endDate: z.string().date().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tasks: z.array(z.any()).optional(),
  taskCount: z.number().optional(),
  completedTaskCount: z.number().optional(),
  taskGroups: z.array(z.any()).optional(),
});

export type GoalDTO = z.infer<typeof GoalDTO>;

export const CreateGoalDTO = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: GoalCategory,
  status: GoalStatus.optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export type CreateGoalDTO = z.infer<typeof CreateGoalDTO>;

export const UpdateGoalDTO = CreateGoalDTO.partial();
export type UpdateGoalDTO = z.infer<typeof UpdateGoalDTO>;


