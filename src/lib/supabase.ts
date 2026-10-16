import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ihdlwogvjfgawgsalgng.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_KobV2o95Ymfem77b4zVBJg_E_onldRD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
