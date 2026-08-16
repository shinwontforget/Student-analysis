'use client'

import React from 'react'
import RevisionShelf from '@/components/RevisionShelf'

export default function RevisionShelfPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <RevisionShelf />
      </div>
    </main>
  )
}
