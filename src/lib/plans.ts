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
  enable_shadowing_upload: boolean;
  
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
  [key: string]: any; // Allow dynamic DB fields
};

// Fallback in case DB is completely empty
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
  enable_shadowing_upload: false,
  
  daily_video_limit: 2,
  max_video_duration_minutes: 25,
  max_shadowing_minutes: 30,
  max_vocabulary_per_video: 25,
  monthly_shadowing_limit: 0,
  max_ai_calls_per_month: 0,
  max_storage_bytes: 10 * 1024 * 1024 * 1024,
  max_decks: 3,
  max_flashcards: 500,
  retention_days: 30,
};

export async function getUserPlanFeatures(user: any): Promise<PlanFeatures> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = user?.email && adminEmails.includes(user.email);
  
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
      enable_shadowing_upload: true,
      
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

  const supabase = await createClient();
  let planId = null;
  let planName = 'FREE';

  // 1. Fetch active subscription if exists
  if (user?.id) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
      
    if (sub && sub.plan_id) {
      planId = sub.plan_id;
      const subPlans: any = sub.plans;
      planName = subPlans?.name || (Array.isArray(subPlans) ? subPlans[0]?.name : 'UNKNOWN') || 'UNKNOWN';
    }
  }

  // 2. Fallback to user_metadata plan if no active sub
  if (!planId) {
    const metaPlan = user?.user_metadata?.plan;
    const fallbackSlug = (metaPlan && metaPlan !== 'free') ? metaPlan : 'free';
    
    const { data: fallbackPlan } = await supabase
      .from('plans')
      .select('id, name')
      .ilike('slug', fallbackSlug)
      .maybeSingle();
      
    if (fallbackPlan) {
      planId = fallbackPlan.id;
      planName = fallbackPlan.name;
    }
  }

  // 3. If DB is totally empty, return hardcoded default
  if (!planId) return DEFAULT_FREE_PLAN;

  // 4. Fetch dynamic features and limits
  const [featuresRes, limitsRes] = await Promise.all([
    supabase.from('plan_features').select('feature_key, is_enabled').eq('plan_id', planId),
    supabase.from('plan_limits').select('limit_key, limit_value').eq('plan_id', planId)
  ]);

  const featuresList = featuresRes.data || [];
  const limitsList = limitsRes.data || [];

  // Initialize result with safe defaults for required TypeScript fields
  const result: PlanFeatures = { ...DEFAULT_FREE_PLAN, name: planName };

  // Map boolean features
  for (const f of featuresList) {
    result[f.feature_key] = f.is_enabled;
  }

  // Map numeric limits (and handle 0 = infinite convention)
  for (const l of limitsList) {
    const val = Number(l.limit_value);
    // If val is 0, consider it unlimited (999999), otherwise use the value.
    // EXCEPT for monthly limits where 0 means literally 0 (no access). 
    // Wait, the logic in previous code was: "0 means unlimited for storage/retention, but 0 means 0 for ai_calls".
    // To be safe, we will just use the value directly, but for known keys we apply the legacy 0 logic.
    if (val === 0) {
      if (['max_storage_bytes', 'daily_video_limit', 'max_video_duration_minutes', 'max_shadowing_minutes', 'max_vocabulary_per_video', 'max_decks', 'retention_days'].includes(l.limit_key)) {
        result[l.limit_key] = 999999;
      } else {
        result[l.limit_key] = 0;
      }
    } else {
      result[l.limit_key] = val;
    }
  }

  return result;
}
