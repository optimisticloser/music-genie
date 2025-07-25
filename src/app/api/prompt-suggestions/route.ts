import { NextResponse } from "next/server";
import { playlistPromptAgent } from "@/lib/workflowai/agents";
import createClient from "@/lib/supabase/server";

interface PromptSuggestionsRequest {
  current_prompt?: string;
  mode: 'initial' | 'enhancement';
}

export async function POST(req: Request) {
  try {
    const body: PromptSuggestionsRequest = await req.json();
    
    let suggestions: string[] = [];
    
    if (body.mode === 'initial') {
      // Para modo inicial, buscar prompts curados do Supabase
      const supabase = await createClient();
      const { data: demoPrompts, error } = await supabase
        .from('demo_prompts')
        .select('prompt')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Error fetching demo prompts:', error);
        // Fallback para prompts estáticos
        suggestions = [
          "Funky 80s songs played on cop movies",
          "Indie folk songs for studying on rainy days", 
          "High-energy electronic music for workouts",
          "Jazz standards that played in old movies",
          "Chill lo-fi beats for late night coding",
          "Upbeat reggae songs for summer road trips"
        ];
      } else {
        suggestions = demoPrompts?.map(p => p.prompt) || [];
      }
    } else {
      // Para modo enhancement, usar WorkflowAI para gerar sugestões contextuais
      try {
        const { output } = await playlistPromptAgent({
          custom_text: body.current_prompt || "",
          category_selections: []
        });

        if (output?.prompt_suggestions && output.prompt_suggestions.length > 0) {
          suggestions = output.prompt_suggestions;
        } else {
          // Fallback para sugestões estáticas baseadas no contexto
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
      } catch (workflowError) {
        console.error('WorkflowAI error:', workflowError);
        // Fallback para sugestões estáticas
        suggestions = [
          "with saxophone solos",
          "from Miami Vice", 
          "action-packed",
          "retro synth beats",
          "that make you dance",
          "from the 80s era"
        ];
      }
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