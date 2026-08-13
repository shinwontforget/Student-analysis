'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Trophy,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  Crown,
  LogOut,
  Brain,
  Zap,
  Library,
  Swords,
  Terminal,
  UserCircle,
} from 'lucide-react'
import Logo from './Logo'
import AvatarSVG, { AvatarId } from './Avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from './Toast'

interface NavUser {
  id: string
  email: string
  full_name: string
  cgpa: number
  is_premium: boolean
  avatar_id?: AvatarId
  student_level?: string
  student_field?: string
}

interface NavbarClientProps {
  user: NavUser | null
}

// Compute gamification title from CGPA
function getClassTitle(cgpa: number): string {
  if (cgpa >= 9.5) return 'Valedictorian Legend'
  if (cgpa >= 9.0) return 'Grand Archmage'
  if (cgpa >= 8.5) return 'Archmage'
  if (cgpa >= 8.0) return 'Scholar Mage'
  if (cgpa >= 7.5) return 'Battle Mage'
  if (cgpa >= 7.0) return 'Apprentice'
  if (cgpa >= 6.0) return 'Initiate'
  if (cgpa >= 5.0) return 'Recruit'
  return 'Greenhorn'
}

function getLevel(cgpa: number): number {
  return Math.max(1, Math.round(cgpa * 5))
}

// Avatar initials
function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const NavbarClient: React.FC<NavbarClientProps> = ({ user }) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Don't render on auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/onboarding')) {
    return null
  }

  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast('Logged out. See you next semester. 👋', 'info')
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard',      label: 'DASHBOARD',     icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/quest-log',      label: 'QUEST LOG',     icon: <Swords className="h-4 w-4" /> },
    { href: '/revision-shelf', label: 'LIBRARY',       icon: <BookOpen className="h-4 w-4" /> },
    { href: '/leaderboard',    label: 'LEADERBOARD',   icon: <Trophy className="h-4 w-4" /> },
    { href: '/premium',        label: 'PREMIUM',       icon: <Crown className="h-4 w-4 text-amber-400" /> },
  ]

  const cgpa = user?.cgpa ?? 0
  const level = getLevel(cgpa)
  const classTitle = getClassTitle(cgpa)
  const initials = user ? getInitials(user.full_name) : '?'
  // Mana = energy proxy from cgpa
  const manaPercent = Math.round((cgpa / 10) * 100)

  return (
    <>
      {/* Top header bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#070712]/95 backdrop-blur-xl font-mono">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          {/* Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <Logo size={32} className="group-hover:scale-105 transition-transform" />
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm text-white tracking-wider block leading-none">
                  ACADEMIC_<span className="text-violet-400">GRIMOIRE</span>
                </span>
                <span className="text-[9px] text-zinc-500 tracking-widest block mt-0.5">
                  SIMULATOR V2.0
                </span>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* CGPA pill */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-950/40 px-3 py-1.5 text-xs font-mono">
                  <Brain className="h-3 w-3 text-violet-400" />
                  <span className="text-violet-300 font-bold">GPA: {cgpa.toFixed(2)}</span>
                </div>
                {/* Avatar */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="hover:scale-105 transition-transform"
                  title={user.full_name}
                >
                  <AvatarSVG avatarId={user.avatar_id ?? 'boy_1'} size={36} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10 transition-all"
                >
                  <Terminal className="h-3.5 w-3.5 text-violet-400" /> SIGN IN
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" /> START YOUR JOURNEY
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out left sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#08071a] border-r border-white/10 flex flex-col shadow-2xl font-mono"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Logo size={28} />
                  <div>
                    <div className="text-[11px] font-extrabold text-white tracking-widest">ACADEMIC</div>
                    <div className="text-[10px] text-violet-400 tracking-widest">GRIMOIRE</div>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Character card */}
              {user ? (
                <div className="p-4 border-b border-white/10">
                  <Link
                    href="/settings"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 mb-3 group rounded-xl p-2 -mx-2 hover:bg-white/5 transition-all cursor-pointer"
                    title="Go to Account Settings"
                  >
                    <div className="relative shrink-0">
                      <AvatarSVG avatarId={user.avatar_id ?? 'boy_1'} size={48} />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#08071a]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-white truncate group-hover:text-violet-300 transition-colors">{user.full_name}</div>
                      <div className="text-[10px] text-violet-300 truncate">{classTitle}</div>
                      <div className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider">Tap to edit profile →</div>
                    </div>
                  </Link>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                      <span className="text-zinc-500">GPA:</span>{' '}
                      <span className="text-violet-300 font-bold">{cgpa.toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                      <span className="text-zinc-500">Mana:</span>{' '}
                      <span className="text-emerald-400 font-bold">{manaPercent}%</span>
                    </div>
                  </div>
                  {user.is_premium && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 font-bold">
                      <Crown className="h-3 w-3" /> PREMIUM ACTIVE
                    </div>
                  )}
                  {/* Logout button right on the card */}
                  <button
                    onClick={() => { setIsSidebarOpen(false); handleSignOut() }}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-950/40 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log Out
                  </button>
                </div>
              ) : (
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <UserCircle className="h-5 w-5" />
                    <span>Not logged in</span>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <div className="text-[9px] font-extrabold tracking-widest text-zinc-600 uppercase px-2 mb-2">
                  Navigation
                </div>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">{link.icon} {link.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </Link>
                  )
                })}
              </nav>

              {/* Bottom — Level Up only */}
              <div className="p-4 border-t border-white/10">
                {user && (
                  <Link
                    href="/quest-log"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:brightness-110 transition-all"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" /> LEVEL UP
                  </Link>
                )}
                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-violet-500/30 bg-violet-950/20 py-2.5 text-[11px] font-bold uppercase tracking-widest text-violet-400 hover:bg-violet-950/40 transition-all"
                  >
                    <Terminal className="h-3.5 w-3.5" /> Log In
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default NavbarClient
