/**
 * server-only guard — Next.js will throw a build error if this module is
 * accidentally imported in a Client Component or any browser-side file.
 */
import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Returns a Supabase client authenticated with the SERVICE ROLE key.
 *
 * Use this ONLY in:
 *  - Server Actions
 *  - Route Handlers  (app/api/*)
 *  - Server-side scripts / cron jobs
 *
 * NEVER import this file in a Client Component or expose the service-role key
 * to the browser. It bypasses every RLS policy.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[admin.ts] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Ensure both are set in your .env.local (server-side only).'
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Disable session persistence — the admin client is stateless and
      // should never store tokens in cookies or localStorage.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
