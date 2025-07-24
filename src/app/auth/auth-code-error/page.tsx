"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, RefreshCw, Mail } from "lucide-react";

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const description = searchParams.get("description");

  const getErrorMessage = () => {
    switch (error) {
      case "no_code":
        return "Nenhum código de confirmação foi fornecido. Verifique se você clicou no link correto do seu email.";
      case "exchange_failed":
        return `Falha ao processar a confirmação: ${description || "Erro desconhecido"}`;
      case "no_user":
        return "Não foi possível recuperar os dados do usuário após a confirmação.";
      case "unexpected":
        return "Ocorreu um erro inesperado durante o processo de confirmação.";
      default:
        return "O link de confirmação pode ter expirado ou ser inválido. Verifique se você clicou no link correto do seu email.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Erro na Confirmação
            </CardTitle>
            <CardDescription className="text-gray-600">
              Houve um problema ao confirmar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getErrorMessage()}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Login
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/signup">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Criar Nova Conta
                </Link>
              </Button>

              {error === "no_code" && (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/forgot-password">
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar Email de Confirmação
                  </Link>
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Se o problema persistir, entre em contato conosco.</p>
              {error && (
                <p className="mt-2 text-xs">
                  Código do erro: {error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 