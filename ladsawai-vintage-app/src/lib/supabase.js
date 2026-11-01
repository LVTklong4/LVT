import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Executes an async Supabase database operation with automatic retry on
 * clock-skew errors (PGRST303 / "JWT issued at future").
 * When client and Supabase server clocks drift by 1-2 seconds, waiting briefly
 * allows the server clock to catch up with the JWT iat claim.
 */
export async function withRetryOnJwtFuture(asyncFn, maxRetries = 2, delayMs = 1500) {
  try {
    return await asyncFn();
  } catch (err) {
    const errMsg = err?.message || err?.error_description || String(err || '');
    const errCode = err?.code;
    const isJwtFuture = errMsg.includes('JWT issued at future') || errCode === 'PGRST303';

    if (isJwtFuture && maxRetries > 0) {
      console.warn(`[Supabase] Clock drift detected (${errMsg}). Auto-retrying in ${delayMs}ms...`);
      try {
        await supabase.auth.getSession();
      } catch (e) {}

      await new Promise(resolve => setTimeout(resolve, delayMs));
      return withRetryOnJwtFuture(asyncFn, maxRetries - 1, delayMs);
    }
    throw err;
  }
}
