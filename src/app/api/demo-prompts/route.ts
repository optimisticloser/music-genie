import { NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: prompts, error } = await supabase
      .from('demo_prompts')
      .select('*')
      .eq('is_active', true)
      .order('popularity_score', { ascending: false });

    if (error) {
      console.error('Error fetching demo prompts:', error);
      return new NextResponse("Failed to fetch demo prompts", { status: 500 });
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Demo prompts API error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 