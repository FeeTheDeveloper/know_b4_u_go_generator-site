import { z } from "zod";

export const driverSchema = z.object({
  driverId: z.string().min(1, "driver_id required"),
  name: z.string().min(1, "name required"),
  cdlNumber: z.string().min(1, "cdl_number required"),
  company: z.string().min(1, "company required"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type DriverInput = z.infer<typeof driverSchema>;

export const drawParamsSchema = z.object({
  companyId: z.string().min(1),
  testType: z.enum(["drug", "alcohol", "both"]),
  cycle: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  year: z.number().int().min(2024).max(2099),
  operator: z.string().min(1, "operator name required"),
});

export type DrawParamsInput = z.infer<typeof drawParamsSchema>;
