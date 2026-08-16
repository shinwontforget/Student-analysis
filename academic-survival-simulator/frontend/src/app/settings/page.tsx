'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Brain, Crown, LogOut, Save, ShieldCheck, Key, Loader2, Sparkles, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import AvatarSVG, { AvatarPicker, AvatarId } from '@/components/Avatar'
import { LEVEL_LABELS, FIELD_LABELS, FIELDS_BY_LEVEL, StudentLevel, StudentField } from '@/data/essay-challenges'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    id: string
    email: string
    full_name: string
    cgpa: number
    is_premium: boolean
    avatar_id: AvatarId
    student_level: StudentLevel
    student_field: StudentField
  } | null>(null)

  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [avatarId, setAvatarId] = useState<AvatarId>('boy_1')
  const [studentLevel, setStudentLevel] = useState<StudentLevel>('college')
  const [studentField, setStudentField] = useState<StudentField>('computer_science')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile({
          id: profile.id,
          email: profile.email || user.email || '',
          full_name: profile.full_name || '',
          cgpa: Number(profile.cgpa) || 7.1,
          is_premium: profile.is_premium || false,
          avatar_id: (profile.avatar_id as AvatarId) || 'boy_1',
          student_level: (profile.student_level as StudentLevel) || 'college',
          student_field: (profile.student_field as StudentField) || 'computer_science',
        })
        setFullName(profile.full_name || '')
        setAvatarId((profile.avatar_id as AvatarId) || 'boy_1')
        setStudentLevel((profile.student_level as StudentLevel) || 'college')
        setStudentField((profile.student_field as StudentField) || 'computer_science')
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        avatar_id: avatarId,
        student_level: studentLevel,
        student_field: studentField,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userProfile.id)

    if (error) {
      toast('Failed to update profile: ' + error.message, 'error')
    } else {
      toast('Profile updated successfully! ✨', 'success')
      setUserProfile({
        ...userProfile,
        full_name: fullName,
        avatar_id: avatarId,
        student_level: studentLevel,
        student_field: studentField,
      })
    }

    if (newPassword.trim()) {
      const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword })
      if (pwdErr) {
        toast('Failed to update password: ' + pwdErr.message, 'error')
      } else {
        toast('Password updated successfully! 🔒', 'success')
        setNewPassword('')
      }
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast('Logged out. See you next semester! 👋', 'info')
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-mono select-none p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
            <User className="h-3.5 w-3.5" /> ACADEMIC PROFILE & SETTINGS
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mt-1">
            ACCOUNT SETTINGS
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-1">
            Manage your scholar profile, avatar, field of study, and security details.
          </p>
        </div>

        {/* User Info Overview Box */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 flex items-center gap-5 shadow-sm">
          <AvatarSVG avatarId={avatarId} size={64} />
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">{userProfile?.full_name || 'Scholar'}</h3>
            <div className="text-xs text-slate-600 flex items-center gap-2 font-sans">
              <Mail className="h-3.5 w-3.5 text-indigo-600" /> {userProfile?.email}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-sans">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-700" />
              <span>{LEVEL_LABELS[studentLevel]} · {FIELD_LABELS[studentField]}</span>
            </div>
            <div className="flex items-center gap-3 pt-1 text-xs">
              <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 font-bold text-indigo-700">
                GPA: {userProfile?.cgpa.toFixed(2)}
              </span>
              <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-700">
                MERIT SCHOLAR
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Selector */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Choose Your Avatar
            </div>
            <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
          </div>

          {/* Education Level & Field */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Academic Field & Level
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-600">Education Level</label>
                <select
                  value={studentLevel}
                  onChange={(e) => {
                    const lvl = e.target.value as StudentLevel
                    setStudentLevel(lvl)
                    setStudentField(FIELDS_BY_LEVEL[lvl][0])
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  {(Object.entries(LEVEL_LABELS) as [StudentLevel, string][]).map(([lvl, label]) => (
                    <option key={lvl} value={lvl}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-600">Subject Field</label>
                <select
                  value={studentField}
                  onChange={(e) => setStudentField(e.target.value as StudentField)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  {FIELDS_BY_LEVEL[studentLevel].map((f) => (
                    <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-3">
              Personal Information
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase text-slate-600">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase text-slate-600">
                Email Address (read-only)
              </label>
              <input
                type="email"
                disabled
                value={userProfile?.email || ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <Key className="h-4 w-4" /> Security Settings
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase text-slate-600">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-100 transition-all"
            >
              <LogOut className="h-4 w-4" /> LOG OUT
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} SAVE CHANGES
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
