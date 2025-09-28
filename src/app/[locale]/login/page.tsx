"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

const AUTH_ERROR_KEYS = [
  "invalidData",
  "invalidCredentials",
  "unexpected",
] as const;

type AuthErrorKey = (typeof AUTH_ERROR_KEYS)[number];

function isAuthErrorKey(value: string): value is AuthErrorKey {
  return (AUTH_ERROR_KEYS as readonly string[]).includes(value);
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const t = useTranslations("auth.login");
  const common = useTranslations("auth.common");
  const messages = useTranslations("auth.messages");
  const locale = useLocale() || "en";

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(formData);
      
      if (result?.error) {
        setError(isAuthErrorKey(result.error) ? result.error : "unexpected");
        setIsLoading(false);
      }
      // Se não há erro, o signIn já fez redirect, então não precisamos fazer nada
    } catch (error) {
      console.error('Login error:', error);
      setError("unexpected");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{common("brandName")}</h1>
          <p className="mt-2 text-sm text-gray-600">{t("subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{messages(error)}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {common("emailLabel")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={common("emailPlaceholder")}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {common("passwordLabel")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={common("passwordPlaceholder")}
                    aria-label={common("passwordLabel")}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  t("button")
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t("forgot")}
              </Link>
              <div className="text-sm text-gray-600">
                {t.rich("signupPrompt", {
                  link: (chunks) => (
                    <Link
                      href="/signup"
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
