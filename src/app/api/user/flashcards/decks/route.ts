import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: decks, error: decksError } = await supabase
      .from('flashcard_decks')
      .select('*, flashcards(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (decksError) throw decksError;

    return NextResponse.json({ success: true, decks });
  } catch (error: any) {
    console.error("Decks GET API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, folder, icon, color, source_language, target_language } = body;

    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({ 
        user_id: user.id, 
        name, 
        description, 
        folder,
        icon,
        color,
        source_language,
        target_language
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, deck: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
