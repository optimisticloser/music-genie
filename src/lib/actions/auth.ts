"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import createClient from "@/lib/supabase/server";
import { defaultLocale, locales } from "@/i18n/routing";

type SupportedLocale = (typeof locales)[number];

function normalizeLocale(entry: FormDataEntryValue | null): SupportedLocale {
  const value = typeof entry === "string" ? entry : null;

  if (value && (locales as readonly string[]).includes(value)) {
    return value as SupportedLocale;
  }

  return defaultLocale as SupportedLocale;
}

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  locale: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  locale: z.string().optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  locale: z.string().optional(),
});

export async function signUp(formData: FormData) {
  const validatedFields = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    locale: formData.get("locale"),
  });

  if (!validatedFields.success) {
    return {
      error: "invalidData",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, fullName, locale } = validatedFields.data;
  const resolvedLocale = normalizeLocale(locale ?? null);
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${resolvedLocale}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: "signUpFailed",
      details: error.message,
    };
  }

  return {
    success: "checkEmail",
  };
}

export async function signIn(formData: FormData) {
  const validatedFields = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
  });

  if (!validatedFields.success) {
    return {
      error: "invalidData",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, locale } = validatedFields.data;
  const resolvedLocale = normalizeLocale(locale ?? null);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "invalidCredentials",
    };
  }

  redirect(`/${resolvedLocale}/dashboard`);
}

export async function signOut(locale?: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const resolvedLocale = normalizeLocale(locale ?? null);
  redirect(`/${resolvedLocale}/login`);
}

export async function resetPassword(formData: FormData) {
  const validatedFields = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    locale: formData.get("locale"),
  });

  if (!validatedFields.success) {
    return {
      error: "invalidEmail",
    };
  }

  const { email, locale } = validatedFields.data;
  const resolvedLocale = normalizeLocale(locale ?? null);
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${resolvedLocale}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      error: "resetFailed",
      details: error.message,
    };
  }

  return {
    success: "resetSent",
  };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const locale = normalizeLocale(formData.get("locale"));
  
  if (!password || password.length < 6) {
    return {
      error: "passwordTooShort",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      error: "updatePasswordFailed",
      details: error.message,
    };
  }

  redirect(`/${locale}/dashboard`);
}
