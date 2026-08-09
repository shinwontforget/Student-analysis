import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Dashboard root — server component that validates the session and
 * renders a basic authenticated placeholder.
 *
 * The middleware already blocks unauthenticated visitors before they reach
 * this page, so the redirect here is a defence-in-depth fallback.
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Should never reach here thanks to middleware, but just in case.
    redirect('/login')
  }

  // Fetch the user's profile row from the public.users table.
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, cgpa, is_premium, user_type')
    .eq('id', user.id)
    .single()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          🔒 This page is protected — only authenticated users can access it.
        </p>

        <dl className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
          <Row label="Email" value={profile?.email ?? user.email ?? '—'} />
          <Row label="Name" value={profile?.full_name ?? '—'} />
          <Row label="User type" value={profile?.user_type ?? '—'} />
          <Row label="CGPA" value={profile?.cgpa?.toString() ?? '0'} />
          <Row
            label="Premium"
            value={profile?.is_premium ? '✅ Yes' : '❌ No'}
          />
        </dl>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  )
}
