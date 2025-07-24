import { NextResponse } from "next/server";
import {
  playlistPromptAgent,
  PlaylistPromptGenerationInput,
} from "@/lib/workflowai/agents";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const input: PlaylistPromptGenerationInput = {
      category_selections: body.category_selections,
      custom_text: body.custom_text,
    };

    const { output } = await playlistPromptAgent(input);

    return NextResponse.json({ prompt: output?.playlist_prompt ?? "" });
  } catch (error) {
    console.error("WorkflowAI prompt error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 