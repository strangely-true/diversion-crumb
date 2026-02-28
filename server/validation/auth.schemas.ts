import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const signupSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    name: z.string().trim().min(2).max(100).optional(),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
