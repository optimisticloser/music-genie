import { NextResponse } from "next/server";
// TODO: Integrar com WorkflowAI quando o prompt generator estiver pronto

interface PromptSuggestionsRequest {
  current_prompt?: string;
  mode: 'initial' | 'enhancement';
}

export async function POST(req: Request) {
  try {
    const body: PromptSuggestionsRequest = await req.json();
    
    // TODO: Substituir por chamada real ao WorkflowAI
    // Por enquanto, retornamos sugestões mock baseadas no modo
    
    let suggestions: string[] = [];
    
    if (body.mode === 'initial') {
      // Sugestões iniciais quando não há prompt
      suggestions = [
        "Funky 80s songs played on cop movies",
        "Indie folk songs for studying on rainy days", 
        "High-energy electronic music for workouts",
        "Jazz standards that played in old movies",
        "Chill lo-fi beats for late night coding",
        "Upbeat reggae songs for summer road trips",
        "Melancholic singer-songwriter tracks about heartbreak",
        "Epic orchestral pieces from fantasy movie soundtracks"
      ];
    } else {
      // Sugestões de melhorias baseadas no prompt atual
      suggestions = [
        "with saxophone solos",
        "from Miami Vice", 
        "action-packed",
        "retro synth beats",
        "that make you dance",
        "from the 80s era",
        "with funky bass lines",
        "perfect for car chases"
      ];
    }
    
    // Randomiza e pega 6 sugestões (3 para cada linha do carrossel)
    const shuffled = suggestions.sort(() => 0.5 - Math.random());
    const selectedSuggestions = shuffled.slice(0, 6);
    
    return NextResponse.json({ 
      suggestions: selectedSuggestions,
      mode: body.mode 
    });
  } catch (error) {
    console.error('Prompt suggestions API error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 