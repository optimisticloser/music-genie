"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, RefreshCw, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";

const AUTH_ERROR_KEYS = [
  "no_code",
  "exchange_failed",
  "no_user",
  "unexpected",
  "default",
] as const;

type AuthErrorKey = (typeof AUTH_ERROR_KEYS)[number];

function resolveErrorKey(value: string | null): AuthErrorKey {
  const normalized = value ?? "default";
  return (AUTH_ERROR_KEYS as readonly string[]).includes(normalized)
    ? (normalized as AuthErrorKey)
    : "default";
}

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const description = searchParams.get("description");
  const t = useTranslations("auth.codeError");
  const messages = useTranslations("auth.codeError.messages");
  const actions = useTranslations("auth.codeError.actions");
  const resolvedError = resolveErrorKey(error);

  const errorMessage =
    resolvedError === "exchange_failed"
      ? messages(resolvedError, {
          description: description || messages("default"),
        })
      : messages(resolvedError);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t("subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {actions("back")}
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/signup">
              <RefreshCw className="mr-2 h-4 w-4" />
              {actions("create")}
            </Link>
          </Button>

          {error === "no_code" && (
            <Button variant="outline" asChild className="w-full">
              <Link href="/forgot-password">
                <Mail className="mr-2 h-4 w-4" />
                {actions("resend")}
              </Link>
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>{t("contact")}</p>
          {error && (
            <p className="mt-2 text-xs">
              {t("errorCode", { code: error })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  const t = useTranslations("auth.codeError");
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {t("loading")}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Suspense fallback={<LoadingFallback />}>
          <AuthCodeErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
