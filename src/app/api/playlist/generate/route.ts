import { NextResponse } from "next/server";
import {
  playlistGeneratorAgent,
  PlaylistGeneratorInput,
} from "@/lib/workflowai/agents";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const input: PlaylistGeneratorInput = {
      prompt: body.prompt,
    };

    const { output, data } = await playlistGeneratorAgent(input);

    return NextResponse.json({ playlist: output, metrics: data });
  } catch (error) {
    console.error("WorkflowAI generate error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 