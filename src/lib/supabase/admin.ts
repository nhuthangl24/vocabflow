import { createClient } from '@supabase/supabase-js'

// This client bypasses RLS and should ONLY be used in secure server contexts (e.g. Admin routes)
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  )
}
