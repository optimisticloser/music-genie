import { redirect } from "next/navigation";
import createClient from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Mail } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo ao Music Genie!</p>
        </div>
        <form action={signOut}>
          <Button variant="outline" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Perfil do Usuário
            </CardTitle>
            <CardDescription>
              Suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
            {profile?.full_name && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{profile.full_name}</span>
              </div>
            )}
            <div className="text-xs text-gray-500">
              Membro desde: {new Date(user.created_at).toLocaleDateString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Playlists</CardTitle>
            <CardDescription>
              Suas playlists criadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhuma playlist criada ainda</p>
              <Button>
                Criar Primeira Playlist
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>
              O que você pode fazer agora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🎵 Criar Playlist</h3>
                <p className="text-sm text-gray-600">
                  Use IA para gerar playlists personalizadas
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📱 Conectar Spotify</h3>
                <p className="text-sm text-gray-600">
                  Sincronize suas playlists com o Spotify
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔗 Compartilhar</h3>
                <p className="text-sm text-gray-600">
                  Compartilhe suas playlists com amigos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 