"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Play, 
  Heart, 
  Clock,
  TrendingUp,
  Music2
} from "lucide-react";

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data for discover page
  const categories = [
    { id: "all", name: "Todas", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { id: "trending", name: "Em alta", color: "bg-gradient-to-r from-red-500 to-orange-500" },
    { id: "new", name: "Novidades", color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
    { id: "mood", name: "Por humor", color: "bg-gradient-to-r from-green-500 to-emerald-500" },
    { id: "genre", name: "Por gênero", color: "bg-gradient-to-r from-indigo-500 to-purple-500" },
  ];

  const featuredPlaylists = [
    {
      id: 1,
      title: "Hits da Semana",
      description: "As músicas mais tocadas da semana",
      tracks: 25,
      duration: "1h 23m",
      gradient: "from-red-400 to-pink-500",
      category: "trending",
      isNew: true
    },
    {
      id: 2,
      title: "Relaxamento Profundo",
      description: "Músicas para relaxar e meditar",
      tracks: 18,
      duration: "1h 45m",
      gradient: "from-blue-400 to-cyan-500",
      category: "mood",
      isNew: false
    },
    {
      id: 3,
      title: "Rock Clássico",
      description: "Os maiores clássicos do rock",
      tracks: 30,
      duration: "2h 15m",
      gradient: "from-gray-600 to-gray-800",
      category: "genre",
      isNew: false
    },
    {
      id: 4,
      title: "Jazz Lounge",
      description: "Jazz suave para momentos especiais",
      tracks: 22,
      duration: "1h 38m",
      gradient: "from-amber-400 to-orange-500",
      category: "genre",
      isNew: true
    },
    {
      id: 5,
      title: "Energia Positiva",
      description: "Músicas para elevar seu astral",
      tracks: 20,
      duration: "1h 12m",
      gradient: "from-green-400 to-emerald-500",
      category: "mood",
      isNew: false
    },
    {
      id: 6,
      title: "Indie Discovery",
      description: "Novos artistas independentes",
      tracks: 15,
      duration: "58m",
      gradient: "from-purple-400 to-pink-500",
      category: "new",
      isNew: true
    }
  ];

  const filteredPlaylists = selectedCategory === "all" 
    ? featuredPlaylists 
    : featuredPlaylists.filter(playlist => playlist.category === selectedCategory);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Descobrir
        </h1>
        <p className="text-gray-600">Encontre novas músicas e playlists incríveis</p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Categorias</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`${selectedCategory === category.id ? category.color : ""} hover:scale-105 transition-transform`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Playlists */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Playlists em Destaque</h2>
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <Card key={playlist.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-0">
                {/* Playlist Cover */}
                <div className={`h-48 bg-gradient-to-br ${playlist.gradient} rounded-t-lg relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button 
                      size="lg" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-16 h-16"
                    >
                      <Play className="w-6 h-6 ml-1" />
                    </Button>
                  </div>
                  
                  {/* New Badge */}
                  {playlist.isNew && (
                    <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-600">
                      Novo
                    </Badge>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 space-y-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-8 h-8 p-0 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {playlist.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {playlist.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Music2 className="w-3 h-3" />
                        {playlist.tracks} músicas
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {playlist.duration}
                      </span>
                    </div>
                    
                    <Button size="sm" variant="outline" className="text-xs">
                      Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6" />
              <h3 className="font-semibold">Trending</h3>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Descubra o que está bombando agora
            </p>
            <Button variant="secondary" size="sm">
              Explorar
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6" />
              <h3 className="font-semibold">AI Recomenda</h3>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Playlists personalizadas com IA
            </p>
            <Button variant="secondary" size="sm">
              Gerar
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-6 h-6" />
              <h3 className="font-semibold">Favoritos</h3>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Suas músicas mais amadas
            </p>
            <Button variant="secondary" size="sm">
              Ver
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 