import { z } from "zod";

export const meetingsInsertSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  agentId: z.string().min(1, { message: "Agent is required" }),
});

export const meetingsUpdateSchema = z.object({
  id: z.string().min(1, { message: "Id is required" }),
  name: z.string().optional(),
  agentId: z.string().optional(),
  status: z.string().optional(),
  summary: z.string().optional(),
  transcriptUrl: z.string().optional(),
  endedAt: z.union([z.string(), z.date()]).optional(),
  startedAt: z.union([z.string(), z.date()]).optional(),
});