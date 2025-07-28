import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get genre statistics
    const { data: genreStats, error: genreError } = await supabase
      .from('playlist_metadata')
      .select('primary_genre')
      .not('primary_genre', 'is', null);

    if (genreError) {
      console.error("Error fetching genre stats:", genreError);
      return NextResponse.json({ error: "Failed to fetch genre statistics" }, { status: 500 });
    }

    // Get mood statistics
    const { data: moodStats, error: moodError } = await supabase
      .from('playlist_metadata')
      .select('mood')
      .not('mood', 'is', null);

    if (moodError) {
      console.error("Error fetching mood stats:", moodError);
      return NextResponse.json({ error: "Failed to fetch mood statistics" }, { status: 500 });
    }

    // Get energy level statistics
    const { data: energyStats, error: energyError } = await supabase
      .from('playlist_metadata')
      .select('energy_level')
      .not('energy_level', 'is', null);

    if (energyError) {
      console.error("Error fetching energy stats:", energyError);
      return NextResponse.json({ error: "Failed to fetch energy statistics" }, { status: 500 });
    }

    // Get all instruments and themes for unique lists
    const { data: allMetadata, error: metadataError } = await supabase
      .from('playlist_metadata')
      .select('dominant_instruments, themes, years')
      .not('dominant_instruments', 'is', null);

    if (metadataError) {
      console.error("Error fetching metadata:", metadataError);
      return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
    }

    // Process statistics
    const genreCounts = genreStats?.reduce((acc, item) => {
      acc[item.primary_genre] = (acc[item.primary_genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const moodCounts = moodStats?.reduce((acc, item) => {
      acc[item.mood] = (acc[item.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const energyCounts = energyStats?.reduce((acc, item) => {
      acc[item.energy_level] = (acc[item.energy_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Process instruments
    const instrumentCounts: Record<string, number> = {};
    allMetadata?.forEach(item => {
      if (item.dominant_instruments) {
        item.dominant_instruments.forEach((instrument: string) => {
          instrumentCounts[instrument] = (instrumentCounts[instrument] || 0) + 1;
        });
      }
    });

    // Process themes
    const themeCounts: Record<string, number> = {};
    allMetadata?.forEach(item => {
      if (item.themes) {
        item.themes.forEach((theme: string) => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });

    // Process years
    const yearCounts: Record<string, number> = {};
    allMetadata?.forEach(item => {
      if (item.years) {
        item.years.forEach((year: string) => {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        });
      }
    });

    // Convert to sorted arrays
    const genreStatsArray = Object.entries(genreCounts)
      .map(([value, count]) => ({ category: 'genre', value, count }))
      .sort((a, b) => b.count - a.count);

    const moodStatsArray = Object.entries(moodCounts)
      .map(([value, count]) => ({ category: 'mood', value, count }))
      .sort((a, b) => b.count - a.count);

    const energyStatsArray = Object.entries(energyCounts)
      .map(([value, count]) => ({ category: 'energy', value, count }))
      .sort((a, b) => b.count - a.count);

    const instrumentStatsArray = Object.entries(instrumentCounts)
      .map(([value, count]) => ({ category: 'instrument', value, count }))
      .sort((a, b) => b.count - a.count);

    const themeStatsArray = Object.entries(themeCounts)
      .map(([value, count]) => ({ category: 'theme', value, count }))
      .sort((a, b) => b.count - a.count);

    const yearStatsArray = Object.entries(yearCounts)
      .map(([value, count]) => ({ category: 'year', value, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      genres: genreStatsArray,
      moods: moodStatsArray,
      energy_levels: energyStatsArray,
      instruments: instrumentStatsArray,
      themes: themeStatsArray,
      years: yearStatsArray,
      total_playlists: genreStats?.length || 0
    });

  } catch (error) {
    console.error("Metadata stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 