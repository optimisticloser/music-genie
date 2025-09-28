"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Music,
  Shield,
  LogOut,
  Save,
  Trash2,
  Globe,
} from "lucide-react";
import createClient from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { localeToMarket, SUPPORTED_LOCALES, SUPPORTED_MARKETS } from "@/lib/locale";
import { useRouter } from "@/i18n/navigation";

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const locale = useLocale() || "en";
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSavingLocalization, setIsSavingLocalization] = useState(false);
  const [localePreference, setLocalePreference] = useState(locale);
  const [marketPreference, setMarketPreference] = useState(localeToMarket(locale));
  const supabase = createClient();
  const router = useRouter();

  const languageOptions = useMemo(
    () =>
      SUPPORTED_LOCALES.map((value) => ({
        value,
        label: t(`localization.languages.${value}` as const),
      })),
    [t]
  );

  const marketOptions = useMemo(
    () =>
      SUPPORTED_MARKETS.map((value) => ({
        value,
        label: t(`localization.markets.${value}` as const),
      })),
    [t]
  );

  const accountInitials = useMemo(() => {
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join("")
      .padEnd(2, "•");
  }, [fullName]);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) return;
        const user = data.user as SupabaseUser | null;
        setFullName(
          ((user?.user_metadata?.full_name as string | undefined) || "").trim()
        );
        setEmail(user?.email ?? "");
      })
      .catch((error) => {
        console.error("Failed to load profile", error);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user as SupabaseUser | null;
      setFullName(
        ((currentUser?.user_metadata?.full_name as string | undefined) || "").trim()
      );
      setEmail(currentUser?.email ?? "");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch("/api/user/preferences");
        if (!response.ok) {
          throw new Error("REQUEST_FAILED");
        }

        const data = await response.json();
        setLocalePreference(data.default_locale ?? locale);
        setMarketPreference(
          data.default_market ?? localeToMarket(data.default_locale ?? locale)
        );
      } catch (error) {
        console.error("Failed to load localization preferences", error);
      } finally {
        setIsLoadingPreferences(false);
      }
    }

    loadPreferences();
  }, [locale]);

  const handleSaveProfile = async () => {
    if (!supabase) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });

      if (error) {
        console.error("Erro ao atualizar perfil", error);
      }
    } catch (error) {
      console.error("Erro inesperado ao salvar perfil", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveLocalization = async () => {
    try {
      setIsSavingLocalization(true);
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          default_locale: localePreference,
          default_market: marketPreference,
        }),
      });

      if (!response.ok) {
        throw new Error("REQUEST_FAILED");
      }

      toast.success(t("localization.messages.success"));

      if (localePreference !== locale) {
        router.replace({ pathname: "/dashboard/settings" }, { locale: localePreference });
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update localization preferences", error);
      toast.error(t("localization.messages.error"));
    } finally {
      setIsSavingLocalization(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao sair", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">Gerencie sua conta e preferências</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 font-semibold flex items-center justify-center">
                {accountInitials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{fullName || "Seu nome"}</p>
                <p className="text-xs text-gray-500">{email || "email não definido"}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                className="mt-1"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="mt-1"
                value={email}
                disabled
                readOnly
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public-profile"
                checked={publicProfile}
                onCheckedChange={setPublicProfile}
              />
              <Label htmlFor="public-profile">Perfil público</Label>
            </div>
            <Button
              className="w-full"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingProfile ? "Salvando..." : "Salvar alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Preferências
            </CardTitle>
            <CardDescription>
              Configure suas preferências de música
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações</Label>
                <p className="text-sm text-gray-500">Receber notificações de novas playlists</p>
              </div>
              <Switch 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Salvamento automático</Label>
                <p className="text-sm text-gray-500">Salvar playlists automaticamente</p>
              </div>
              <Switch 
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t("localization.title")}
            </CardTitle>
            <CardDescription>{t("localization.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="locale-select">{t("localization.languageLabel")}</Label>
              <select
                id="locale-select"
                value={localePreference}
                disabled={isLoadingPreferences || isSavingLocalization}
                onChange={(event) => setLocalePreference(event.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{t("localization.languageHint")}</p>
            </div>

            <div>
              <Label htmlFor="market-select">{t("localization.marketLabel")}</Label>
              <select
                id="market-select"
                value={marketPreference}
                disabled={isLoadingPreferences || isSavingLocalization}
                onChange={(event) => setMarketPreference(event.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {marketOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{t("localization.marketHint")}</p>
            </div>

            <Button
              className="w-full"
              onClick={handleSaveLocalization}
              disabled={isSavingLocalization || isLoadingPreferences}
            >
              {isSavingLocalization
                ? t("localization.actions.saving")
                : t("localization.actions.save")}
            </Button>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie a segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Senha atual</Label>
              <Input id="current-password" type="password" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" className="mt-1" />
            </div>
            <Button variant="outline" className="w-full">
              Alterar senha
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure suas notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email</Label>
                <p className="text-sm text-gray-500">Receber emails</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Push</Label>
                <p className="text-sm text-gray-500">Notificações no navegador</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Excluir conta</h4>
              <p className="text-sm text-red-700">Esta ação não pode ser desfeita</p>
            </div>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div>
              <h4 className="font-medium text-orange-900">Sair da conta</h4>
              <p className="text-sm text-orange-700">Você será desconectado</p>
            </div>
            <Button
              variant="outline"
              className="text-orange-600 border-orange-200"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isSigningOut ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
