"use client";

import { CoverArtGenerator } from "@/components/playlist/CoverArtGenerator";
import { PageTitle } from "@/components/shared/PageTitle";

export default function TestCoverGeneratorPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageTitle title="🎨 Teste do Gerador de Capas" />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🎨 Teste do Gerador de Capas</h1>
        <p className="text-muted-foreground">Teste a geração de capas de playlist com IA</p>
      </div>
      
      <CoverArtGenerator 
        playlistName="Contemporary Indie Party Anthems"
        playlistDescription="This playlist is a carefully curated selection of contemporary and modern alternative/indie tracks designed to create the perfect party atmosphere. Each song was chosen to embody the energetic and vibrant spirit of a gathering, while strictly adhering to the specified genres and era. The tracks feature driving rhythms, catchy melodies, and often anthemic choruses that encourage singing along and dancing."
        songList="The Strokes - Reptilia; Franz Ferdinand - Take Me Out; The Black Keys - Lonely Boy; Arctic Monkeys - Fluorescent Adolescent; Jet - Are You Gonna Be My Girl; Vampire Weekend - A-Punk; Bloc Party - Banquet; Neon Trees - Animal"
        onCoverGenerated={(coverArt, description) => {
          console.log("🎨 Cover generated:", { coverArt, description });
        }}
      />
    </div>
  );
} 