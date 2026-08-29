import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use admin client for cache bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function generateCacheKey(text: string, settings: any, type: string): string {
  const data = JSON.stringify({ text, settings, type });
  return crypto.createHash("sha256").update(data).digest("hex");
}

export async function getCachedExtraction(hashKey: string) {
  try {
    const { data, error } = await supabase
      .from("ai_api_cache")
      .select("response_json")
      .eq("hash_key", hashKey)
      .single();
      
    if (error || !data) return null;
    return data.response_json;
  } catch (e) {
    console.error("Cache read error:", e);
    return null;
  }
}

export async function setCachedExtraction(hashKey: string, type: string, settings: any, responseJson: any, provider: string) {
  try {
    await supabase.from("ai_api_cache").upsert({
      hash_key: hashKey,
      type,
      settings_hash: crypto.createHash("md5").update(JSON.stringify(settings)).digest("hex"),
      response_json: responseJson,
      provider,
    });
  } catch (e) {
    console.error("Cache write error:", e);
  }
}
