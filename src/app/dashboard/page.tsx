"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { 
  Sparkles, 
  Play, 
  MoreHorizontal,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Playlist {
  id: string;
  name: string;
  creator: string;
  gradient: string;
  trackCount: number;
  duration: string;
}

const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Good Vibes Mix',
    creator: 'Music Genie AI',
    gradient: 'from-blue-400 to-purple-600',
    trackCount: 45,
    duration: '2h 34m',
  },
  {
    id: '2',
    name: 'Chill Evening',
    creator: 'Music Genie AI',
    gradient: 'from-green-400 to-blue-600',
    trackCount: 32,
    duration: '1h 48m',
  },
  {
    id: '3',
    name: 'Workout Beats',
    creator: 'Music Genie AI',
    gradient: 'from-red-400 to-orange-600',
    trackCount: 28,
    duration: '1h 12m',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        // setProfile(profile); // This line was removed as per the edit hint
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 rounded-3xl p-12 text-center border border-red-100">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Crie sua playlist perfeita
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Descreva o que você quer ouvir e nossa IA criará uma playlist personalizada 
                com as melhores músicas para o momento.
              </p>
              
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                onClick={() => router.push("/dashboard/generate")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar com IA
              </Button>
            </div>
          </div>
        </div>

        {/* Welcome Back */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta, {user.email}
          </h2>
          <p className="text-gray-600">
            Suas playlists criadas e descobertas musicais
          </p>
        </div>

        {/* Playlists Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Playlists</h3>
            <Button variant="ghost" size="sm" className="text-gray-500">
              Ver todas
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mockPlaylists.map((playlist) => (
              <Link key={playlist.id} href={`/dashboard/playlist/${playlist.id}`}>
                <Card className="group cursor-pointer hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    {/* Playlist Artwork */}
                    <div className={`aspect-square bg-gradient-to-br ${playlist.gradient} rounded-t-lg relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Button 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-12 h-12"
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle play action here
                            console.log("Play playlist:", playlist.id);
                          }}
                        >
                          <Play className="w-5 h-5 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Playlist Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                        {playlist.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">
                        {playlist.creator}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{playlist.trackCount} músicas • {playlist.duration}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recently Played */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Tocadas recentemente</h3>
            <Button variant="ghost" size="sm" className="text-gray-500">
              Ver todas
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPlaylists.slice(0, 3).map((playlist) => (
              <Link key={`recent-${playlist.id}`} href={`/dashboard/playlist/${playlist.id}`}>
                <Card className="group cursor-pointer hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${playlist.gradient} rounded-lg flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 truncate">
                          {playlist.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {playlist.creator}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle more options here
                          console.log("More options for:", playlist.id);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
} 