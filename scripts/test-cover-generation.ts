// Script de teste para o workflow de geração de capas de playlist
// Execute com: npx tsx scripts/test-cover-generation.ts

import { WorkflowAI, Image } from "@workflowai/workflowai";

// Initialize WorkflowAI Client
const workflowAI = new WorkflowAI({
  // optional, defaults to process.env.WORKFLOWAI_API_KEY
  // key: // Add your API key here
});

// Initialize Your AI agent
export interface PlaylistCoverArtGenerationInput {
  playlist_name?: string;
  playlist_description?: string;
  song_list?: string;
  style_preferences?: string;
  color_preferences?: string;
}

export interface PlaylistCoverArtGenerationOutput {
  cover_art?: Image;
  design_description?: string;
}

const playlistCoverArtGeneration = workflowAI.agent<
  PlaylistCoverArtGenerationInput,
  PlaylistCoverArtGenerationOutput
>({
  id: "playlist-cover-art-generation",
  schemaId: 1,
  version: "dev",
  // Cache options:
  // - "auto" (default): if a previous run exists with the same version and input, and if
  // the temperature is 0, the cached output is returned
  // - "always": the cached output is returned when available, regardless
  // of the temperature value
  // - "never": the cache is never used
  useCache: "auto",
});

// Run Your AI agent
async function playlistCoverArtGenerationRun() {
  const input: PlaylistCoverArtGenerationInput = {
    "color_preferences": "Vibrant yellows, energetic oranges, and bright magentas",
    "playlist_name": "Contemporary Indie Party Anthems",
    "playlist_description": "This playlist is a carefully curated selection of contemporary and modern alternative/indie tracks designed to create the perfect party atmosphere. Each song was chosen to embody the energetic and vibrant spirit of a gathering, while strictly adhering to the specified genres and era. The tracks feature driving rhythms, catchy melodies, and often anthemic choruses that encourage singing along and dancing.\n\nThe selection spans a range of sounds within the alternative and indie spectrum, from the danceable grooves of bands like Franz Ferdinand and Bloc Party to the more laid-back yet still infectious vibes of artists like TV Girl and Steve Lacy. The focus is on songs released in recent decades that have become staples of modern indie culture and are known for their ability to energize a crowd. The inclusion of both well-known hits and slightly deeper cuts ensures a dynamic listening experience that keeps the energy high throughout the party.\n\nUltimately, this playlist is more than just a collection of songs; it's a carefully constructed sonic journey designed to elevate any contemporary party. The combination of modern production, alternative sensibilities, and undeniable hooks makes these tracks the ideal soundtrack for a night of fun, dancing, and good times, perfectly fulfilling the prompt's requirements for a Contemporary / Modern, Party, Alternative / Indie playlist.",
    "style_preferences": "Bright, energetic, vibrant",
    "song_list": "The Strokes - Reptilia; Franz Ferdinand - Take Me Out; The Black Keys - Lonely Boy; Arctic Monkeys - Fluorescent Adolescent; Jet - Are You Gonna Be My Girl; Vampire Weekend - A-Punk; Bloc Party - Banquet; Neon Trees - Animal",
  };

  try {
    console.log("🎨 Starting cover art generation...");
    console.log("📋 Input:", JSON.stringify(input, null, 2));

    const {
      output,
      data: { duration_seconds, cost_usd, version },
    } = await playlistCoverArtGeneration(input);

    console.log("\n✅ Generation completed!");
    console.log("🎨 Output:", output);
    console.log("\n📊 Metadata:");
    console.log("Model: ", version?.properties?.model);
    console.log("Cost: $", cost_usd);
    console.log("Latency: ", duration_seconds?.toFixed(2), "s");

    if (output?.cover_art) {
      console.log("\n🖼️ Cover Art URL:", output.cover_art.url);
      console.log("📝 Design Description:", output.design_description);
    }

  } catch (error) {
    console.error("❌ Failed to run:", error);
  }
}

// Execute the test
if (require.main === module) {
  playlistCoverArtGenerationRun();
} 