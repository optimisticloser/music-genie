import { NextResponse } from "next/server";
import {
  playlistPromptAgent,
  PlaylistPromptGenerationInput,
} from "@/lib/workflowai/agents";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Converter formato antigo para novo se necessário
    let category_selections: { category?: string; selection?: string; }[] = [];
    
    if (body.category_selections?.categories && body.category_selections?.selections) {
      // Formato antigo - converter
      const categories = body.category_selections.categories;
      const selections = body.category_selections.selections;
      category_selections = categories.map((category: string, index: number) => ({
        category,
        selection: selections[index] || ""
      }));
    } else if (Array.isArray(body.category_selections)) {
      // Formato novo - usar diretamente
      category_selections = body.category_selections;
    }
    
    const input: PlaylistPromptGenerationInput = {
      category_selections,
      custom_text: body.custom_text,
    };
    
    const { output } = await playlistPromptAgent(input);
    
    return NextResponse.json({ 
      prompt: output?.playlist_prompt ?? "",
      suggestions: output?.prompt_suggestions ?? []
    });
  } catch (error) {
    console.error("WorkflowAI prompt error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 