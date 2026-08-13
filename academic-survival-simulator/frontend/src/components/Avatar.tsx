'use client'

import React from 'react'

export type AvatarId =
  | 'boy_1' | 'boy_2' | 'boy_3' | 'boy_4' | 'boy_5'
  | 'girl_1' | 'girl_2' | 'girl_3' | 'girl_4' | 'girl_5'

export interface AvatarMeta {
  id: AvatarId
  name: string
  gender: 'boy' | 'girl'
  desc: string
  skinTone: string
  hairColor: string
  accent: string
}

export const AVATARS: AvatarMeta[] = [
  { id: 'boy_1',  name: 'Arjun',  gender: 'boy',  desc: 'Dark skin, glasses, hoodie',       skinTone: '#8D5524', hairColor: '#1a1a1a', accent: '#7c3aed' },
  { id: 'boy_2',  name: 'Kai',    gender: 'boy',  desc: 'East Asian, athletic, cap',          skinTone: '#D4A373', hairColor: '#111',    accent: '#2563eb' },
  { id: 'boy_3',  name: 'Marcus', gender: 'boy',  desc: 'Black, afro, confident smile',       skinTone: '#3D1A00', hairColor: '#1a1a1a', accent: '#f59e0b' },
  { id: 'boy_4',  name: 'Liam',   gender: 'boy',  desc: 'Fair skin, messy hair, casual',      skinTone: '#FDDBB4', hairColor: '#c8a96e', accent: '#10b981' },
  { id: 'boy_5',  name: 'Dev',    gender: 'boy',  desc: 'South Asian, polo shirt, neat',      skinTone: '#C68642', hairColor: '#1a1a1a', accent: '#ef4444' },
  { id: 'girl_1', name: 'Priya',  gender: 'girl', desc: 'South Asian, bun, studious',         skinTone: '#C68642', hairColor: '#1a1a1a', accent: '#ec4899' },
  { id: 'girl_2', name: 'Zara',   gender: 'girl', desc: 'Black, natural curls, artsy',        skinTone: '#5C3317', hairColor: '#2a1a0a', accent: '#8b5cf6' },
  { id: 'girl_3', name: 'Mei',    gender: 'girl', desc: 'East Asian, twin tails, cute',       skinTone: '#D4A373', hairColor: '#111',    accent: '#06b6d4' },
  { id: 'girl_4', name: 'Sofia',  gender: 'girl', desc: 'Latina, wavy hair, expressive',      skinTone: '#B5651D', hairColor: '#2d1b00', accent: '#f97316' },
  { id: 'girl_5', name: 'Emma',   gender: 'girl', desc: 'Fair, glasses, bookish vibes',       skinTone: '#FDDBB4', hairColor: '#b45309', accent: '#14b8a6' },
]

function BoyAvatar({ skin, hair, accent }: { skin: string; hair: string; accent: string }) {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Body */}
      <rect x="20" y="52" width="40" height="28" rx="6" fill={accent} />
      {/* Neck */}
      <rect x="34" y="46" width="12" height="8" fill={skin} />
      {/* Head */}
      <ellipse cx="40" cy="34" rx="18" ry="20" fill={skin} />
      {/* Hair */}
      <ellipse cx="40" cy="18" rx="18" ry="10" fill={hair} />
      <rect x="22" y="18" width="36" height="10" fill={hair} />
      {/* Eyes */}
      <ellipse cx="33" cy="34" rx="3" ry="3.5" fill="white" />
      <ellipse cx="47" cy="34" rx="3" ry="3.5" fill="white" />
      <circle cx="33" cy="34.5" r="1.8" fill="#1a1a1a" />
      <circle cx="47" cy="34.5" r="1.8" fill="#1a1a1a" />
      <circle cx="33.7" cy="33.8" r="0.6" fill="white" />
      <circle cx="47.7" cy="33.8" r="0.6" fill="white" />
      {/* Nose */}
      <ellipse cx="40" cy="40" rx="1.5" ry="1" fill={skin} style={{ filter: 'brightness(0.85)' }} />
      {/* Mouth */}
      <path d="M35 44 Q40 48 45 44" stroke="#8B4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="22" cy="34" rx="3" ry="4" fill={skin} />
      <ellipse cx="58" cy="34" rx="3" ry="4" fill={skin} />
    </svg>
  )
}

function GirlAvatar({ skin, hair, accent }: { skin: string; hair: string; accent: string }) {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Body */}
      <rect x="18" y="52" width="44" height="28" rx="8" fill={accent} />
      {/* Neck */}
      <rect x="34" y="46" width="12" height="8" fill={skin} />
      {/* Head */}
      <ellipse cx="40" cy="34" rx="17" ry="19" fill={skin} />
      {/* Long hair back */}
      <ellipse cx="40" cy="16" rx="18" ry="10" fill={hair} />
      <rect x="22" y="16" width="5" height="28" rx="3" fill={hair} />
      <rect x="53" y="16" width="5" height="28" rx="3" fill={hair} />
      <rect x="24" y="16" width="32" height="12" fill={hair} />
      {/* Eyes with lashes */}
      <ellipse cx="33" cy="33" rx="3.2" ry="3.8" fill="white" />
      <ellipse cx="47" cy="33" rx="3.2" ry="3.8" fill="white" />
      <circle cx="33" cy="33.5" r="2" fill="#1a1a1a" />
      <circle cx="47" cy="33.5" r="2" fill="#1a1a1a" />
      <circle cx="33.8" cy="32.8" r="0.7" fill="white" />
      <circle cx="47.8" cy="32.8" r="0.7" fill="white" />
      {/* Eyelashes */}
      <path d="M30 30 L29 28 M33 29.5 L33 27.5 M36 30 L37 28" stroke={hair} strokeWidth="1" />
      <path d="M44 30 L43 28 M47 29.5 L47 27.5 M50 30 L51 28" stroke={hair} strokeWidth="1" />
      {/* Nose */}
      <ellipse cx="40" cy="38.5" rx="1.2" ry="0.8" fill={skin} style={{ filter: 'brightness(0.85)' }} />
      {/* Lips */}
      <path d="M35.5 43 Q38 41.5 40 42 Q42 41.5 44.5 43" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M35.5 43 Q40 46 44.5 43" stroke={accent} strokeWidth="1.5" fill={`${accent}40`} strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="23" cy="34" rx="3" ry="4" fill={skin} />
      <ellipse cx="57" cy="34" rx="3" ry="4" fill={skin} />
    </svg>
  )
}

export function AvatarSVG({ avatarId, size = 48, className = '' }: { avatarId: AvatarId; size?: number; className?: string }) {
  const meta = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0]
  const isBoy = meta.gender === 'boy'

  return (
    <div
      className={`rounded-full overflow-hidden border-2 border-violet-500/40 bg-gradient-to-br from-violet-950 to-purple-900 shadow-lg ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {isBoy ? (
        <BoyAvatar skin={meta.skinTone} hair={meta.hairColor} accent={meta.accent} />
      ) : (
        <GirlAvatar skin={meta.skinTone} hair={meta.hairColor} accent={meta.accent} />
      )}
    </div>
  )
}

export function AvatarPicker({
  selected,
  onSelect,
}: {
  selected: AvatarId
  onSelect: (id: AvatarId) => void
}) {
  const boys = AVATARS.filter((a) => a.gender === 'boy')
  const girls = AVATARS.filter((a) => a.gender === 'girl')

  return (
    <div className="space-y-4">
      {/* Boys row */}
      <div>
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 mb-2">⚡ SCHOLARS</div>
        <div className="grid grid-cols-5 gap-3">
          {boys.map((av) => (
            <button
              key={av.id}
              type="button"
              onClick={() => onSelect(av.id)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                selected === av.id
                  ? 'border-violet-500 bg-violet-950/60 shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                  : 'border-white/10 bg-white/5 hover:border-violet-400/50 hover:bg-violet-950/30'
              }`}
            >
              <AvatarSVG avatarId={av.id} size={48} />
              <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider">{av.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Girls row */}
      <div>
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400 mb-2">✨ SCHOLARS</div>
        <div className="grid grid-cols-5 gap-3">
          {girls.map((av) => (
            <button
              key={av.id}
              type="button"
              onClick={() => onSelect(av.id)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                selected === av.id
                  ? 'border-pink-500 bg-pink-950/40 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                  : 'border-white/10 bg-white/5 hover:border-pink-400/50 hover:bg-pink-950/20'
              }`}
            >
              <AvatarSVG avatarId={av.id} size={48} />
              <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider">{av.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected info */}
      <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-2.5">
        <AvatarSVG avatarId={selected} size={36} />
        <div>
          <div className="text-xs font-black text-white">
            {AVATARS.find((a) => a.id === selected)?.name}
          </div>
          <div className="text-[10px] text-zinc-400 font-sans">
            {AVATARS.find((a) => a.id === selected)?.desc}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarSVG
