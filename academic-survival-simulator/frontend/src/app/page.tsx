import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/components/HomeClient'

/**
 * Home page — server component.
 * If the user is already logged in → redirect to /dashboard.
 * If not → render the public landing page.
 */
export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <HomeClient />
}
