import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Dashboard from '@/components/Dashboard'

/**
 * Dashboard page — server component that validates session and loads user profile.
 * Passes isFirstTime=true if no profile row exists yet (triggers onboarding modal).
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's profile row from the public.users table.
  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, cgpa, is_premium, user_type, avatar_id, student_level, student_field')
    .eq('id', user.id)
    .single()

  // Check if user has ever completed habit onboarding setup
  const { count: habitCount } = await supabase
    .from('daily_habit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Show habit onboarding modal ONLY if user has no habit log yet (first-time user)
  const isFirstTime = !profile || !habitCount || habitCount === 0

  const userData = {
    id: user.id,
    email: profile?.email || user.email || 'student@university.edu',
    full_name: profile?.full_name || user.user_metadata?.full_name || '',
    cgpa: profile?.cgpa ?? 3.00,
    is_premium: profile?.is_premium ?? false,
    user_type: profile?.user_type || 'student',
    avatar_id: profile?.avatar_id || 'boy_1',
    student_level: profile?.student_level || 'college',
    student_field: profile?.student_field || 'computer_science',
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Dashboard user={userData} isFirstTime={isFirstTime} />
    </main>
  )
}
