const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: plans, error } = await supabase.from('plans').select('*');
  if (error) { console.error(error); return; }
  
  for (const plan of plans) {
    console.log(`Migrating plan ${plan.name}...`);
    
    // Set slug if missing
    if (!plan.slug) {
      await supabase.from('plans').update({ slug: plan.name.toLowerCase() }).eq('id', plan.id);
    }
    
    // Migrate features
    const features = [
      { key: 'enable_vocabulary', val: plan.enable_vocabulary },
      { key: 'enable_grammar', val: plan.enable_grammar },
      { key: 'enable_flashcards', val: plan.enable_flashcards },
      { key: 'enable_srs', val: plan.enable_srs },
      { key: 'enable_library', val: plan.enable_library },
      { key: 'enable_personal_upload', val: plan.enable_personal_upload },
      { key: 'enable_system_library', val: plan.enable_system_library },
      { key: 'enable_shadowing', val: plan.enable_shadowing }
    ];
    
    for (const f of features) {
      if (f.val !== undefined && f.val !== null) {
        await supabase.from('plan_features').upsert({ plan_id: plan.id, feature_key: f.key, is_enabled: f.val }, { onConflict: 'plan_id, feature_key' });
      }
    }
    
    // Migrate limits
    const limits = [
      { key: 'daily_video_limit', val: plan.daily_video_limit },
      { key: 'max_video_duration_minutes', val: plan.max_video_duration_minutes },
      { key: 'max_shadowing_minutes', val: plan.max_shadowing_minutes },
      { key: 'max_vocabulary_per_video', val: plan.max_vocabulary_per_video },
      { key: 'monthly_shadowing_limit', val: plan.monthly_shadowing_limit },
      { key: 'max_ai_calls_per_month', val: plan.max_ai_calls_per_month },
      { key: 'max_storage_bytes', val: plan.max_storage_bytes },
      { key: 'max_decks', val: plan.max_decks },
      { key: 'max_flashcards', val: plan.max_flashcards },
      { key: 'retention_days', val: plan.retention_days }
    ];
    
    for (const l of limits) {
      if (l.val !== undefined && l.val !== null) {
        await supabase.from('plan_limits').upsert({ plan_id: plan.id, limit_key: l.key, limit_value: l.val }, { onConflict: 'plan_id, limit_key' });
      }
    }
  }
  console.log("Done migrating plans!");
}

run();
