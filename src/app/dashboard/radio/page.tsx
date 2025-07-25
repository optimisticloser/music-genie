"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Radio, 
  Play, 
  Pause, 
  Heart, 
  Clock,
  Users,
  Mic2,
  Headphones
} from "lucide-react";

export default function RadioPage() {
  const [playingStation, setPlayingStation] = useState<number | null>(null);

  const radioStations = [
    {
      id: 1,
      name: "Jazz Lounge",
      genre: "Jazz",
      listeners: 1247,
      isLive: true,
      currentTrack: "Take Five - Dave Brubeck",
      gradient: "from-amber-400 to-orange-500",
      description: "Jazz suave para relaxar"
    },
    {
      id: 2,
      name: "Rock Classics",
      genre: "Rock",
      listeners: 2156,
      isLive: true,
      currentTrack: "Stairway to Heaven - Led Zeppelin",
      gradient: "from-gray-600 to-gray-800",
      description: "Os maiores clássicos do rock"
    },
    {
      id: 3,
      name: "Chill Vibes",
      genre: "Ambient",
      listeners: 892,
      isLive: true,
      currentTrack: "Weightless - Marconi Union",
      gradient: "from-blue-400 to-cyan-500",
      description: "Músicas para relaxar e meditar"
    },
    {
      id: 4,
      name: "Electronic Beats",
      genre: "Electronic",
      listeners: 3456,
      isLive: true,
      currentTrack: "Strobe - Deadmau5",
      gradient: "from-purple-400 to-pink-500",
      description: "Beats eletrônicos para dançar"
    },
    {
      id: 5,
      name: "Acoustic Sessions",
      genre: "Folk",
      listeners: 678,
      isLive: true,
      currentTrack: "Hallelujah - Jeff Buckley",
      gradient: "from-green-400 to-emerald-500",
      description: "Músicas acústicas intimistas"
    },
    {
      id: 6,
      name: "Latin Grooves",
      genre: "Latin",
      listeners: 1890,
      isLive: true,
      currentTrack: "Despacito - Luis Fonsi",
      gradient: "from-red-400 to-pink-500",
      description: "Ritmos latinos contagiantes"
    }
  ];

  const podcasts = [
    {
      id: 1,
      title: "História da Música",
      host: "Prof. Carlos Silva",
      episodes: 45,
      duration: "45-60 min",
      category: "Educação",
      gradient: "from-indigo-400 to-purple-500",
      isNew: true
    },
    {
      id: 2,
      title: "Tech & Music",
      host: "Ana Costa",
      episodes: 32,
      duration: "30-45 min",
      category: "Tecnologia",
      gradient: "from-cyan-400 to-blue-500",
      isNew: false
    },
    {
      id: 3,
      title: "Indie Spotlight",
      host: "Pedro Santos",
      episodes: 67,
      duration: "20-35 min",
      category: "Música",
      gradient: "from-pink-400 to-rose-500",
      isNew: false
    }
  ];

  const handlePlayStation = (stationId: number) => {
    setPlayingStation(playingStation === stationId ? null : stationId);
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
          <Radio className="w-8 h-8 text-blue-500" />
          Rádio & Podcasts
        </h1>
        <p className="text-gray-600">Ouça estações ao vivo e podcasts incríveis</p>
      </div>

      {/* Live Radio Stations */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Estações ao Vivo</h2>
          <Badge variant="destructive" className="animate-pulse">
            AO VIVO
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {radioStations.map((station) => (
            <Card key={station.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                {/* Station Cover */}
                <div className={`h-40 bg-gradient-to-br ${station.gradient} rounded-t-lg relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => handlePlayStation(station.id)}
                      className={`${playingStation === station.id ? 'bg-white/90' : 'opacity-0 group-hover:opacity-100 bg-white/90'} hover:bg-white text-black rounded-full w-16 h-16 transition-all`}
                    >
                      {playingStation === station.id ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Live Badge */}
                  <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 animate-pulse">
                    AO VIVO
                  </Badge>
                  
                  {/* Listeners */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-white text-xs bg-black/20 px-2 py-1 rounded">
                    <Users className="w-3 h-3" />
                    {station.listeners.toLocaleString()}
                  </div>
                </div>

                {/* Station Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {station.name}
                      </h3>
                      <p className="text-sm text-gray-600">{station.genre}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="w-8 h-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {station.description}
                  </p>
                  
                  {/* Current Track */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Tocando agora:</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {station.currentTrack}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => handlePlayStation(station.id)}
                    className={`w-full ${playingStation === station.id ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {playingStation === station.id ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Ouvir
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Podcasts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Podcasts em Destaque</h2>
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                {/* Podcast Cover */}
                <div className={`h-32 bg-gradient-to-br ${podcast.gradient} rounded-t-lg relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button 
                      size="lg" 
                      className="opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-black rounded-full w-12 h-12"
                    >
                      <Play className="w-4 h-4 ml-0.5" />
                    </Button>
                  </div>
                  
                  {/* New Badge */}
                  {podcast.isNew && (
                    <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-600">
                      Novo
                    </Badge>
                  )}
                  
                  <div className="absolute bottom-3 left-3">
                    <Mic2 className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Podcast Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    por {podcast.host}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      {podcast.episodes} episódios
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {podcast.duration}
                    </span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {podcast.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Radio className="w-6 h-6" />
              <h3 className="font-semibold">Minhas Estações</h3>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Suas estações favoritas salvas
            </p>
            <Button variant="secondary" size="sm">
              Ver favoritas
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Mic2 className="w-6 h-6" />
              <h3 className="font-semibold">Criar Podcast</h3>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Comece seu próprio podcast
            </p>
            <Button variant="secondary" size="sm">
              Criar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 