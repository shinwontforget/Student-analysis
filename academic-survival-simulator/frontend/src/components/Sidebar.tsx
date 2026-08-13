'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Trophy,
  Crown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Zap,
} from 'lucide-react'
import Logo from './Logo'

interface SidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      href: '/dashboard',
      label: 'Semester Simulation',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: '/revision-shelf',
      label: 'Revision Shelf',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      href: '/essay-mode',
      label: 'Essay Mode',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      href: '/leaderboard',
      label: 'Leaderboard',
      icon: <Trophy className="h-4 w-4" />,
    },
  ]

  return (
    <aside
      className={`sticky top-0 h-screen z-40 flex flex-col border-r border-white/10 bg-[#070712]/95 backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <Logo size={32} className="shrink-0 animate-pulse" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-widest text-white uppercase font-mono leading-none">
                ACADEMIC_
              </span>
              <span className="text-[10px] font-bold text-violet-400 font-mono tracking-wider">
                SURVIVAL.EXE
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto font-mono">
        <div className={`px-2 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-zinc-600 ${isCollapsed ? 'hidden' : 'block'}`}>
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-lg shadow-violet-600/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`shrink-0 ${isActive ? 'text-violet-400' : 'text-zinc-400'}`}>
                {item.icon}
              </span>

              {!isCollapsed && (
                <span className="truncate text-[11px] uppercase tracking-wider font-bold">
                  {item.label}
                </span>
              )}

              {isActive && !isCollapsed && (
                <motion.div
                  layoutId="activeSidebarIndicator"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Banner */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/10">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-[11px] mb-1 font-mono uppercase">
              <Crown className="h-3.5 w-3.5 shrink-0" /> Unlimited Pass
            </div>
            <p className="text-[10px] text-zinc-400 leading-snug">
              Bypass 7.5 CGPA limit & access all features.
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
