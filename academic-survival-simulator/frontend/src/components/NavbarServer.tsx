import { createClient } from '@/lib/supabase/server'
import NavbarClient from './Navbar'

/**
 * Server component that reads the Supabase session, then passes minimal
 * user info to the client Navbar so it can show avatar / CGPA / logout.
 */
export default async function NavbarServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { full_name?: string; cgpa?: number; is_premium?: boolean; avatar_id?: string; student_level?: string; student_field?: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('full_name, cgpa, is_premium, avatar_id, student_level, student_field')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const navUser = user
    ? {
        id: user.id,
        email: user.email ?? '',
        full_name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Scholar',
        cgpa: profile?.cgpa ?? 0,
        is_premium: profile?.is_premium ?? false,
        avatar_id: (profile?.avatar_id as any) ?? 'boy_1',
        student_level: profile?.student_level ?? 'college',
        student_field: profile?.student_field ?? 'computer_science',
      }
    : null

  return <NavbarClient user={navUser} />
}
