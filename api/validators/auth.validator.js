import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(150, "Full name must be at most 150 characters").optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email address"),
  password: z.string().trim().min(8, "Password must be at least 8 characters").max(100),
});



export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email address"),
});
export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export const appleLoginSchema = z.object({
  identity_token: z.string().min(10),
  full_name: z.string().trim().min(2).max(150).optional().nullable(),
});

export const googleLoginSchema = z.object({
  id_token: z.string().min(10),
});




export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const logoutSchema = z.object({});