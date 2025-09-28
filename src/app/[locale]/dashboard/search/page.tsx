"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Play, MoreHorizontal } from "lucide-react";

const BROWSE_CATEGORIES = [
  { key: "jazz", color: "from-blue-500 to-purple-600" },
  { key: "rock", color: "from-red-500 to-orange-600" },
  { key: "pop", color: "from-pink-500 to-red-500" },
  { key: "classical", color: "from-indigo-500 to-blue-600" },
  { key: "electronic", color: "from-cyan-500 to-blue-500" },
  { key: "hipHop", color: "from-gray-700 to-gray-900" },
  { key: "country", color: "from-yellow-600 to-orange-600" },
  { key: "rnb", color: "from-purple-600 to-pink-600" },
] as const;

const MOCK_RESULTS = {
  albums: [
    {
      id: 1,
      title: "Trouser Jazz",
      artist: "Mr. Scruff",
      artwork: "from-red-400 to-red-600",
    },
    {
      id: 2,
      title: "Afro Cuban Jazz",
      artist: "Graciela & Mario Bauza",
      artwork: "from-blue-400 to-cyan-500",
    },
    {
      id: 3,
      title: "Greatest Jazz Masters",
      artist: "Firehouse Five Plus Two",
      artwork: "from-orange-400 to-red-500",
    },
    {
      id: 4,
      title: "Let's Dance Jazz",
      artist: "Verschiedenes",
      artwork: "from-yellow-300 to-orange-400",
    },
    {
      id: 5,
      title: "Lovely Jazz the Ladies Sing",
      artist: "Various Artists",
      artwork: "from-gray-400 to-gray-600",
    },
  ],
  artists: [
    {
      id: 1,
      name: "Nil's Jazz Ensemble",
      artwork: "from-orange-400 to-red-500",
    },
    {
      id: 2,
      name: "New York Jazz Lounge",
      artwork: "from-purple-400 to-blue-500",
    },
    {
      id: 3,
      name: "Christian Jazz Artists Network",
      artwork: "from-amber-300 to-yellow-400",
    },
    {
      id: 4,
      name: "The Modern Jazz Quartet",
      artwork: "from-gray-400 to-gray-600",
    },
    {
      id: 5,
      name: "Art Blakey & The Jazz Messengers",
      artwork: "from-green-400 to-blue-500",
    },
    {
      id: 6,
      name: "Jazzy B",
      artwork: "from-red-400 to-pink-500",
    },
  ],
  songs: [
    {
      id: 1,
      title: "Siempre (feat. Oscar Stagnaro & Miguel Zenón)",
      artist: "Nil's Jazz Ensemble",
      album: "Christian Jazz Artists Network",
      duration: "4:23",
    },
    {
      id: 2,
      title: "How Great Thou Art - Jamie Reid",
      artist: "Christian Jazz Artists Network",
      album: "Various Artists",
      duration: "3:45",
    },
    {
      id: 3,
      title: "Fat Bottomed Girls",
      artist: "Queen",
      album: "Jazz",
      duration: "3:16",
    },
    {
      id: 4,
      title: "Frosty the Snow Man",
      artist: "New York Jazz Lounge",
      album: "Christmas Jazz",
      duration: "2:54",
    },
    {
      id: 5,
      title: "Django",
      artist: "The Modern Jazz Quartet",
      album: "Django",
      duration: "5:32",
    },
    {
      id: 6,
      title: "Don't Stop Me Now",
      artist: "Queen",
      album: "Jazz",
      duration: "3:29",
    },
  ],
} as const;

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("dashboard.search");

  const hasResults = searchQuery.trim().length > 0;

  const categoryTiles = useMemo(
    () =>
      BROWSE_CATEGORIES.map((category) => ({
        ...category,
        label: t(`browse.categories.${category.key}`),
      })),
    [t]
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("header.title")}</h1>
          <p className="text-gray-600 mb-6">{t("header.subtitle")}</p>

          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t("header.placeholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-12 pr-4 py-4 text-lg bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {!hasResults ? (
          <div>
            <div className="flex flex-col gap-3 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t("browse.title")}</h2>
              <p className="text-sm text-gray-500">{t("results.empty")}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryTiles.map((category) => (
                <Card key={category.key} className="cursor-pointer hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    <div
                      className={`h-32 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center`}
                    >
                      <h3 className="text-white text-lg font-semibold">{category.label}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Albums */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("results.albums")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {MOCK_RESULTS.albums.map((album) => (
                  <Card key={album.id} className="group cursor-pointer hover:shadow-lg transition-all">
                    <CardContent className="p-0">
                      <div
                        className={`aspect-square bg-gradient-to-br ${album.artwork} rounded-t-lg relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Button
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-12 h-12"
                          >
                            <Play className="w-5 h-5 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm truncate">{album.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{album.artist}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Artists */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("results.artists")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {MOCK_RESULTS.artists.map((artist) => (
                  <Card key={artist.id} className="group cursor-pointer hover:shadow-lg transition-all">
                    <CardContent className="p-4 text-center">
                      <div
                        className={`w-24 h-24 mx-auto bg-gradient-to-br ${artist.artwork} rounded-full mb-4 relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Button
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-8 h-8"
                          >
                            <Play className="w-4 h-4 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm text-center truncate">
                        {artist.name}
                      </h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Songs */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("results.songs")}</h2>
              <div className="space-y-2">
                {MOCK_RESULTS.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 group cursor-pointer"
                  >
                    <div className="w-8 flex items-center justify-center">
                      <span className="text-sm text-gray-500 group-hover:hidden">{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 hidden group-hover:flex opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{song.title}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {song.artist} • {song.album}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-500 min-w-[40px] text-right">{song.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
