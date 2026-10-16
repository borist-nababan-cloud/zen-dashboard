import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables (.env) with production fallback
export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://ihdlwogvjfgawgsalgng.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_KobV2o95Ymfem77b4zVBJg_E_onldRD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
