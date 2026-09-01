import { createClient } from "@/lib/supabase/server";

export type PlanFeatures = {
  name: string;
  enable_vocabulary: boolean;
  enable_grammar: boolean;
  enable_flashcards: boolean;
  enable_srs: boolean;
  enable_library: boolean;
  enable_personal_upload: boolean;
  enable_system_library: boolean;
  enable_shadowing: boolean;
  
  daily_video_limit: number;
  max_video_duration_minutes: number;
  max_shadowing_minutes: number;
  max_vocabulary_per_video: number;
  monthly_shadowing_limit: number;
  max_ai_calls_per_month: number;
  max_storage_bytes: number;
  max_decks: number;
  max_flashcards: number;
  retention_days: number;
};

// Default free plan features if none found
export const DEFAULT_FREE_PLAN: PlanFeatures = {
  name: "FREE",
  enable_vocabulary: true,
  enable_grammar: true,
  enable_flashcards: true,
  enable_srs: true,
  enable_library: true,
  enable_personal_upload: true,
  enable_system_library: false,
  enable_shadowing: false,
  
  daily_video_limit: 2,
  max_video_duration_minutes: 25,
  max_shadowing_minutes: 30,
  max_vocabulary_per_video: 25,
  monthly_shadowing_limit: 0,
  max_ai_calls_per_month: 0,
  max_storage_bytes: 10 * 1024 * 1024 * 1024, // 10GB
  max_decks: 3,
  max_flashcards: 500, // User request: free 500
  retention_days: 30,
};

export async function getUserPlanFeatures(user: any): Promise<PlanFeatures> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = user?.email && adminEmails.includes(user.email);
  
  // If user is admin, return infinite/unlocked plan
  if (isAdmin) {
    return {
      name: "ADMIN",
      enable_vocabulary: true,
      enable_grammar: true,
      enable_flashcards: true,
      enable_srs: true,
      enable_library: true,
      enable_personal_upload: true,
      enable_system_library: true,
      enable_shadowing: true,
      
      daily_video_limit: 999999,
      max_video_duration_minutes: 999999,
      max_shadowing_minutes: 999999,
      max_vocabulary_per_video: 999999,
      monthly_shadowing_limit: 999999,
      max_ai_calls_per_month: 999999,
      max_storage_bytes: 9999999999999,
      max_decks: 999999,
      max_flashcards: 999999,
      retention_days: 999999,
    };
  }

  const planName = (user?.user_metadata?.plan || "free").toUpperCase();
  const supabase = await createClient();

  const { data: planData, error } = await supabase
    .from("plans")
    .select("*")
    .ilike("name", planName)
    .single();

  if (error || !planData) {
    console.error("Could not fetch user plan features, falling back to default:", error?.message);
    return DEFAULT_FREE_PLAN;
  }

  // Parse DB row to PlanFeatures, with fallbacks for 0 (unlimited) or missing values
  return {
    name: planData.name,
    enable_vocabulary: planData.enable_vocabulary ?? true,
    enable_grammar: planData.enable_grammar ?? true,
    enable_flashcards: planData.enable_flashcards ?? true,
    enable_srs: planData.enable_srs ?? true,
    enable_library: planData.enable_library ?? true,
    enable_personal_upload: planData.enable_personal_upload ?? true,
    enable_system_library: planData.enable_system_library ?? false,
    enable_shadowing: planData.enable_shadowing ?? false,
    
    daily_video_limit: planData.daily_video_limit === 0 ? 999999 : (planData.daily_video_limit ?? DEFAULT_FREE_PLAN.daily_video_limit),
    max_video_duration_minutes: planData.max_video_duration_minutes === 0 ? 999999 : (planData.max_video_duration_minutes ?? DEFAULT_FREE_PLAN.max_video_duration_minutes),
    max_shadowing_minutes: planData.max_shadowing_minutes === 0 ? 999999 : (planData.max_shadowing_minutes ?? DEFAULT_FREE_PLAN.max_shadowing_minutes),
    max_vocabulary_per_video: planData.max_vocabulary_per_video === 0 ? 999999 : (planData.max_vocabulary_per_video ?? DEFAULT_FREE_PLAN.max_vocabulary_per_video),
    monthly_shadowing_limit: planData.monthly_shadowing_limit === 0 ? 999999 : (planData.monthly_shadowing_limit ?? 0),
    max_ai_calls_per_month: planData.max_ai_calls_per_month === 0 ? 999999 : (planData.max_ai_calls_per_month ?? 0),
    max_storage_bytes: planData.max_storage_bytes === 0 ? 9999999999999 : (planData.max_storage_bytes ?? DEFAULT_FREE_PLAN.max_storage_bytes),
    max_decks: planData.max_decks === 0 ? 999999 : (planData.max_decks ?? DEFAULT_FREE_PLAN.max_decks),
    max_flashcards: planData.max_flashcards === 0 ? 999999 : (planData.max_flashcards ?? (planData.name.toLowerCase() === 'basic' ? 1000 : DEFAULT_FREE_PLAN.max_flashcards)),
    retention_days: planData.retention_days === 0 ? 999999 : (planData.retention_days ?? DEFAULT_FREE_PLAN.retention_days),
  };
}
