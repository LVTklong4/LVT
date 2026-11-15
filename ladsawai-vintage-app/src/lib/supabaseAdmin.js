import 'server-only';
import { createClient } from '@supabase/supabase-js';

let adminClient;

export function getSupabaseAdmin() {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!adminKey) return null;

  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
    adminClient = createClient(supabaseUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
}
