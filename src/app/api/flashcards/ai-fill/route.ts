import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/ai/provider";
import { z } from "zod";

const aiSchema = z.object({
  meaning: z.string().describe("Translation or meaning of the word in Vietnamese"),
  pronunciation: z.string().describe("IPA pronunciation"),
  part_of_speech: z.string().describe("e.g., noun, verb, adjective"),
  example: z.string().describe("A real world example sentence using the word"),
  example_translation: z.string().describe("Translation of the example sentence in Vietnamese"),
  synonyms: z.array(z.string()).describe("List of synonyms (up to 3)"),
  cefr: z.string().describe("CEFR level (A1, A2, B1, B2, C1, C2) or equivalent if not English"),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { term } = await request.json();
    if (!term) return NextResponse.json({ error: "Term is required" }, { status: 400 });

    const ai = getProvider("vocab");
    const result = await ai.generateStructuredOutput({
      systemPrompt: "You are an expert linguist and lexicographer. Given a word or phrase, provide its meaning, pronunciation, part of speech, a natural example sentence, translation of the example, synonyms, and CEFR level. If the word is not English, adapt the response appropriately (e.g. HSK for Chinese). Target language is Vietnamese.",
      userPrompt: `Word/Phrase: ${term}`,
      schema: aiSchema,
      tracking: { userId: user.id, taskType: "flashcard_ai_fill" }
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("AI Fill Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
