"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Play, Shuffle, Heart, MoreHorizontal, Download, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork?: string;
}

// Interface for future use when implementing real playlist data
// interface Playlist {
//   id: string;
//   title: string;
//   creator: string;
//   description: string;
//   artwork?: string;
//   tracks: PlaylistTrack[];
// }

export default function PlaylistPage() {
  const router = useRouter();
  const params = useParams();
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

  // Mock playlist data - will be replaced with real data later
  const mockPlaylist = {
    id: params.id,
    name: "Jazzercise: The Ad Rhythm",
    creator: "Sergio Fernandes",
    description: "Get ready to sweat with \"Jazzercise: The Ad Rhythm\"! This playlist fuses vibrant jazz grooves with electrifying beats, perfect for HIIT workouts. Let the energizing melodies and pulsating rhythms motivate you through every rep, every set, and every drop of sweat. Whether you're crushing cardio or powering through strength training, this collection delivers the perfect soundtrack to keep your energy high and your body moving. Jazz it up, get your heart pumping, and turn your workout into a rhythmic celebration!",
    gradient: "from-gray-400 to-gray-700",
    trackCount: 12,
    duration: "47 min",
    tracks: [
      {
        id: 1,
        title: "Pick Up the Pieces",
        artist: "Average White Band",
        album: "Average White Band",
        duration: "3:54",
        artwork: "/api/placeholder/40/40"
      },
      {
        id: 2,
        title: "Chameleon",
        artist: "Herbie Hancock",
        album: "Head Hunters",
        duration: "15:44",
        artwork: "/api/placeholder/40/40"
      },
      {
        id: 3,
        title: "Smooth Operator (Single Version)",
        artist: "Sade",
        album: "The Best of Sade",
        duration: "4:18",
        artwork: "/api/placeholder/40/40"
      },
      {
        id: 4,
        title: "Ain't Nobody",
        artist: "Chaka Khan",
        album: "The Best Hits of the 80s",
        duration: "4:40",
        artwork: "/api/placeholder/40/40"
      }
    ]
  };

  const formatTime = (duration: string) => duration;

  return (
    <ScrollArea className="h-full">
      <div className="relative">
        {/* Header with Artwork and Info */}
        <div className={`bg-gradient-to-br ${mockPlaylist.gradient} relative`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-12 flex items-end gap-8">
            {/* Large Artwork */}
            <div className="w-64 h-64 bg-black/20 rounded-2xl shadow-2xl flex-shrink-0 overflow-hidden">
              <div className={`w-full h-full bg-gradient-to-br ${mockPlaylist.gradient} flex items-center justify-center`}>
                <div className="text-white/30 text-6xl font-bold">
                  {mockPlaylist.name.charAt(0)}
                </div>
              </div>
            </div>

            {/* Playlist Info */}
            <div className="text-white flex-1 min-w-0">
              <p className="text-sm font-medium mb-2 opacity-90">Playlist</p>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                {mockPlaylist.name}
              </h1>
              <div className="mb-6">
                <p className="text-red-300 font-semibold text-lg mb-2">
                  {mockPlaylist.creator}
                </p>
                <div className="text-sm opacity-90 max-w-2xl">
                  <p className="line-clamp-3">
                    {mockPlaylist.description}
                  </p>
                  <button className="text-white font-semibold hover:underline mt-1">
                    MAIS
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm opacity-90">
                <span>{mockPlaylist.trackCount} músicas</span>
                <span>•</span>
                <span>{mockPlaylist.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 py-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Button 
              size="lg" 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold"
              onClick={() => console.log("Play playlist:", mockPlaylist.id)}
            >
              <Play className="w-5 h-5 mr-2 ml-0.5" />
              Reproduzir
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 rounded-full font-semibold border-gray-300"
              onClick={() => console.log("Shuffle playlist:", mockPlaylist.id)}
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Aleatório
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full"
                onClick={() => console.log("Like playlist:", mockPlaylist.id)}
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full"
                onClick={() => console.log("Download playlist:", mockPlaylist.id)}
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full"
                onClick={() => console.log("More options:", mockPlaylist.id)}
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="px-8 py-6">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b border-gray-200 mb-4">
            <div className="w-8"></div>
            <div>Música</div>
            <div>Artista</div>
            <div>Álbum</div>
            <div className="w-16 text-center">
              <Clock className="w-4 h-4 mx-auto" />
            </div>
          </div>

          {/* Tracks */}
          <div className="space-y-1">
            {mockPlaylist.tracks.map((track, index) => (
              <div 
                key={track.id}
                className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 group cursor-pointer"
                onClick={() => console.log("Play track:", track.id)}
              >
                {/* Track Number / Play Button */}
                <div className="w-8 flex items-center justify-center">
                  <span className="text-sm text-gray-500 group-hover:hidden">
                    {index + 1}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-6 h-6 p-0 hidden group-hover:flex opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Play track:", track.id);
                    }}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                </div>

                {/* Track Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 rounded"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {track.title}
                    </p>
                  </div>
                </div>

                {/* Artist */}
                <div className="flex items-center min-w-0">
                  <p className="text-gray-600 truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Album */}
                <div className="flex items-center min-w-0">
                  <p className="text-gray-600 truncate">
                    {track.album}
                  </p>
                </div>

                {/* Duration & Actions */}
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Like track:", track.id);
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-500 min-w-[35px] text-center">
                    {formatTime(track.duration)}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("More options for track:", track.id);
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
} 