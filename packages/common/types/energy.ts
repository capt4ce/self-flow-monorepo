import { z } from "zod";

export const EnergyReadingDTO = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  level: z.number().int().min(1).max(10),
  note: z.string().nullable(),
  timestamp: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type EnergyReadingDTO = z.infer<typeof EnergyReadingDTO>;

export const CreateEnergyReadingDTO = z.object({
  level: z.number().int().min(1).max(10),
  note: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type CreateEnergyReadingDTO = z.infer<typeof CreateEnergyReadingDTO>;

export const UpdateEnergyReadingDTO = z.object({
  level: z.number().int().min(1).max(10).optional(),
  note: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export type UpdateEnergyReadingDTO = z.infer<typeof UpdateEnergyReadingDTO>;


