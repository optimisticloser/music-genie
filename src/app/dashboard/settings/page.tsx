"use client";

import { useState } from "react";
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
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

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
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Seu nome" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" className="mt-1" disabled />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="public-profile" 
                checked={publicProfile}
                onCheckedChange={setPublicProfile}
              />
              <Label htmlFor="public-profile">Perfil público</Label>
            </div>
            <Button className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar alterações
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
            <Button variant="outline" className="text-orange-600 border-orange-200">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 