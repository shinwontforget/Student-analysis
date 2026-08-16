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
  FileText,
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
    { href: '/essay-mode',     label: 'ESSAY MODE',    icon: <FileText className="h-4 w-4 text-pink-400" /> },
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
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl font-mono shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          {/* Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <Logo size={32} className="group-hover:scale-105 transition-transform" />
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm text-slate-900 tracking-wider block leading-none">
                  ACADEMIC_<span className="text-indigo-600">GRIMOIRE</span>
                </span>
                <span className="text-[9px] text-slate-400 tracking-widest block mt-0.5 font-bold">
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
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-mono">
                  <Brain className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-indigo-700 font-bold">GPA: {cgpa.toFixed(2)}</span>
                </div>
                {/* Avatar */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="hover:scale-105 transition-transform rounded-full ring-2 ring-slate-200"
                  title={user.full_name}
                >
                  <AvatarSVG avatarId={user.avatar_id ?? 'boy_1'} size={36} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200 transition-all"
                >
                  <Terminal className="h-3.5 w-3.5 text-indigo-600" /> SIGN IN
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-all"
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
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl font-mono text-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Logo size={28} />
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-900 tracking-widest">ACADEMIC</div>
                    <div className="text-[10px] text-indigo-600 font-bold tracking-widest">GRIMOIRE</div>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Character card */}
              {user ? (
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <Link
                    href="/settings"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 mb-3 group rounded-xl p-2 -mx-2 hover:bg-slate-100 transition-all cursor-pointer"
                    title="Go to Account Settings"
                  >
                    <div className="relative shrink-0">
                      <AvatarSVG avatarId={user.avatar_id ?? 'boy_1'} size={48} />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{user.full_name}</div>
                      <div className="text-[10px] text-indigo-600 font-bold truncate">{classTitle}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">Tap to edit profile →</div>
                    </div>
                  </Link>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs">
                      <span className="text-slate-400">GPA:</span>{' '}
                      <span className="text-indigo-600 font-bold">{cgpa.toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs">
                      <span className="text-slate-400">Mana:</span>{' '}
                      <span className="text-emerald-600 font-bold">{manaPercent}%</span>
                    </div>
                  </div>
                  {/* Logout button right on the card */}
                  <button
                    onClick={() => { setIsSidebarOpen(false); handleSignOut() }}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-100 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log Out
                  </button>
                </div>
              ) : (
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <UserCircle className="h-5 w-5" />
                    <span>Not logged in</span>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <div className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase px-2 mb-2">
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
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">{link.icon} {link.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </Link>
                  )
                })}
              </nav>

              {/* Bottom — Level Up only */}
              <div className="p-4 border-t border-slate-100">
                {user && (
                  <Link
                    href="/quest-log"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-all"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" /> LEVEL UP
                  </Link>
                )}
                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-[11px] font-bold uppercase tracking-widest text-indigo-700 hover:bg-indigo-100 transition-all"
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
