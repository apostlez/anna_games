import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://nknybfpwlzrjhdygsxts.supabase.co';
const fallbackPublishableKey = 'sb_publishable_IKl8qJp1ZyT-cG4B6eVt1g_D3nxtU68';

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || fallbackUrl,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackPublishableKey,
};

export const supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey);
