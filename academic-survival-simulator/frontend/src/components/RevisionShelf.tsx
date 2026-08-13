'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Loader2,
  ExternalLink,
  Plus,
  MessageSquareText,
  AlertCircle,
  X,
  Video,
  Trash2,
  Zap,
  Swords,
  CheckSquare,
  Square,
  Edit3,
  Brain,
  Wand2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from './Toast'

export interface ConceptCard {
  id: string
  title: string
  subject: string
  summary: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export const RevisionShelf: React.FC = () => {
  const router = useRouter()
  const supabase = createClient()

  const [concepts, setConcepts] = useState<ConceptCard[]>([])
  const [selectedForQuiz, setSelectedForQuiz] = useState<string[]>([])
  const [loadingShelf, setLoadingShelf] = useState<boolean>(true)

  // Mascot AI Text Explanation
  const [explainingConceptId, setExplainingConceptId] = useState<string | null>(null)
  const [explanationMap, setExplanationMap] = useState<Record<string, { text: string; error?: string }>>({})
  const [loadingExplainId, setLoadingExplainId] = useState<string | null>(null)

  // AI Note Improvement State
  const [improvingNoteId, setImprovingNoteId] = useState<string | null>(null)

  // YouTube Search Drawer
  const [youtubeConceptId, setYoutubeConceptId] = useState<string | null>(null)
  const [youtubeMap, setYoutubeMap] = useState<Record<string, any[]>>({})
  const [loadingYoutubeId, setLoadingYoutubeId] = useState<string | null>(null)

  // Modal for adding a new concept card
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [editingConcept, setEditingConcept] = useState<ConceptCard | null>(null)
  const [newTitle, setNewTitle] = useState<string>('')
  const [newSubject, setNewSubject] = useState<string>('')
  const [newSummary, setNewSummary] = useState<string>('')
  const [savingConcept, setSavingConcept] = useState<boolean>(false)

  // Fetch persistent concepts from Supabase
  useEffect(() => {
    async function loadShelf() {
      setLoadingShelf(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('revision_shelf')
          .select('id, title, subject, summary, difficulty')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          setConcepts(data as ConceptCard[])
        } else {
          setConcepts([])
        }
      }
      setLoadingShelf(false)
    }
    loadShelf()
  }, [])

  const toggleSelectForQuiz = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedForQuiz((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleLaunchQuizFromSelected = () => {
    const selectedConcepts = concepts.filter((c) => selectedForQuiz.includes(c.id))
    const topicTitles = selectedConcepts.length > 0
      ? selectedConcepts.map((c) => c.title)
      : concepts.map((c) => c.title)

    if (topicTitles.length === 0) {
      toast('Add topics to your shelf before taking a quiz!', 'info')
      return
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_selected_topics', JSON.stringify(topicTitles))
      if (selectedConcepts[0]?.subject) {
        localStorage.setItem('quiz_selected_subject', selectedConcepts[0].subject)
      }
    }

    toast(`⚔️ Launching Quiz on ${topicTitles.length} topic(s)!`, 'success')
    router.push(`/quest-log?topics=${encodeURIComponent(topicTitles.join(','))}`)
  }

  // AI Improve / Polish Note
  const handleAiImproveNote = async (e: React.MouseEvent, concept: ConceptCard) => {
    e.stopPropagation()
    setImprovingNoteId(concept.id)

    try {
      const res = await fetch('/api/mascot/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptTitle: concept.title,
          conceptSubject: concept.subject,
          conceptSummary: concept.summary,
          mode: 'improve',
        }),
      })

      const data = await res.json()
      if (res.ok && (data.explanation || data.reply)) {
        const improvedText = data.explanation || data.reply

        // Update state
        setConcepts((prev) =>
          prev.map((c) => (c.id === concept.id ? { ...c, summary: improvedText } : c))
        )

        // Save to Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (user && !concept.id.startsWith('c_')) {
          await supabase
            .from('revision_shelf')
            .update({ summary: improvedText, updated_at: new Date().toISOString() })
            .eq('id', concept.id)
        }

        toast(`✨ AI enhanced notes for "${concept.title}"!`, 'success')
      } else {
        toast(data.error || 'AI Note improvement failed', 'error')
      }
    } catch {
      toast('Network error connecting to AI', 'error')
    } finally {
      setImprovingNoteId(null)
    }
  }

  const handleExplainText = async (e: React.MouseEvent, concept: ConceptCard, force = true) => {
    e.stopPropagation()
    setExplainingConceptId(concept.id)

    if (!force && explanationMap[concept.id]?.text) return

    setLoadingExplainId(concept.id)
    setExplanationMap((prev) => ({ ...prev, [concept.id]: { text: '' } }))

    try {
      const res = await fetch('/api/mascot/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptTitle: concept.title,
          conceptSubject: concept.subject,
          conceptSummary: concept.summary,
          mode: 'explain',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setExplanationMap((prev) => ({
          ...prev,
          [concept.id]: { text: data.explanation || data.reply || 'No explanation returned.' },
        }))
      } else {
        setExplanationMap((prev) => ({
          ...prev,
          [concept.id]: { text: '', error: data.error || 'Failed to generate explanation.' },
        }))
      }
    } catch {
      setExplanationMap((prev) => ({
        ...prev,
        [concept.id]: { text: '', error: 'Network error connecting to Mascot AI.' },
      }))
    } finally {
      setLoadingExplainId(null)
    }
  }

  const handleFindYoutube = async (e: React.MouseEvent, concept: ConceptCard) => {
    e.stopPropagation()
    setYoutubeConceptId(concept.id)

    if (youtubeMap[concept.id]) return

    setLoadingYoutubeId(concept.id)
    try {
      const res = await fetch(
        `/api/youtube-search?q=${encodeURIComponent(`${concept.title} ${concept.subject} tutorial explanation`)}`
      )
      const data = await res.json()

      if (res.ok && data.videos) {
        setYoutubeMap((prev) => ({ ...prev, [concept.id]: data.videos }))
      } else {
        setYoutubeMap((prev) => ({ ...prev, [concept.id]: [] }))
      }
    } catch (err) {
      setYoutubeMap((prev) => ({ ...prev, [concept.id]: [] }))
    } finally {
      setLoadingYoutubeId(null)
    }
  }

  const handleOpenEdit = (e: React.MouseEvent, concept: ConceptCard) => {
    e.stopPropagation()
    setEditingConcept(concept)
    setNewTitle(concept.title)
    setNewSubject(concept.subject)
    setNewSummary(concept.summary)
    setShowAddModal(true)
  }

  const handleSaveConcept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newSubject.trim() || !newSummary.trim()) return

    setSavingConcept(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (editingConcept) {
      // Editing existing concept
      const updated: ConceptCard = {
        ...editingConcept,
        title: newTitle.toUpperCase(),
        subject: newSubject.toUpperCase(),
        summary: newSummary,
      }

      setConcepts((prev) => prev.map((c) => (c.id === editingConcept.id ? updated : c)))

      if (user && !editingConcept.id.startsWith('c_')) {
        await supabase
          .from('revision_shelf')
          .update({
            title: updated.title,
            subject: updated.subject,
            summary: updated.summary,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingConcept.id)
      }
      toast(`📝 Updated "${updated.title}"!`, 'success')
    } else {
      // Creating new concept
      if (user) {
        const { data, error } = await supabase
          .from('revision_shelf')
          .insert({
            user_id: user.id,
            title: newTitle.toUpperCase(),
            topic: newTitle.toUpperCase(),
            subject: newSubject.toUpperCase(),
            summary: newSummary,
            difficulty: 'Hard',
          })
          .select()
          .single()

        if (error) {
          toast('Failed to save concept: ' + error.message, 'error')
        } else if (data) {
          setConcepts((prev) => [data as ConceptCard, ...prev])
          toast(`📚 Saved "${data.title}" to Revision Shelf!`, 'success')
        }
      } else {
        const newCard: ConceptCard = {
          id: `c_${Date.now()}`,
          title: newTitle.toUpperCase(),
          subject: newSubject.toUpperCase(),
          summary: newSummary,
          difficulty: 'Hard',
        }
        setConcepts((prev) => [newCard, ...prev])
        toast(`📚 Added "${newCard.title}" locally!`, 'success')
      }
    }

    setEditingConcept(null)
    setNewTitle('')
    setNewSubject('')
    setNewSummary('')
    setShowAddModal(false)
    setSavingConcept(false)
  }

  const handleDeleteConcept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('revision_shelf').delete().eq('id', id)
    }

    setConcepts((prev) => prev.filter((c) => c.id !== id))
    setSelectedForQuiz((prev) => prev.filter((i) => i !== id))
    toast('Concept removed from shelf', 'info')
  }

  const toggleDifficulty = async (e: React.MouseEvent, concept: ConceptCard) => {
    e.stopPropagation()
    const nextDiff = concept.difficulty === 'Hard' ? 'Medium' : 'Hard'

    const { data: { user } } = await supabase.auth.getUser()
    if (user && !concept.id.startsWith('c_')) {
      await supabase
        .from('revision_shelf')
        .update({ difficulty: nextDiff })
        .eq('id', concept.id)
    }

    setConcepts((prev) =>
      prev.map((c) => (c.id === concept.id ? { ...c, difficulty: nextDiff } : c))
    )
  }

  const explainingConcept = concepts.find((c) => c.id === explainingConceptId)
  const youtubeConcept = concepts.find((c) => c.id === youtubeConceptId)

  return (
    <div className="relative overflow-hidden bg-[#070712] text-zinc-100 font-mono select-none">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-violet-600/10 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-violet-400">
              <Sparkles className="h-3.5 w-3.5" /> REVISION SHELF & STUDY SHEET
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
              MY REVISION NOTES
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Add your notes before exams. Select cards to generate targeted quizzes or let AI expand your notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLaunchQuizFromSelected}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-violet-600/30 hover:brightness-110 transition-all"
            >
              <Swords className="h-4 w-4" /> GENERATE QUIZ ({selectedForQuiz.length > 0 ? selectedForQuiz.length : concepts.length})
            </button>

            <button
              onClick={() => {
                setEditingConcept(null)
                setNewTitle('')
                setNewSubject('')
                setNewSummary('')
                setShowAddModal(true)
              }}
              className="flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-950/40 px-5 py-3 text-xs font-black uppercase tracking-widest text-violet-300 shadow-md hover:bg-violet-900/50 transition-all"
            >
              <Plus className="h-4 w-4" /> ADD NOTE
            </button>
          </div>
        </div>

        {/* 3-Column Concept Cards Grid */}
        {loadingShelf ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : concepts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0d0c1d] p-12 text-center space-y-4">
            <Brain className="h-12 w-12 text-violet-400 mx-auto" />
            <h3 className="text-lg font-black uppercase text-white tracking-wide">
              YOUR REVISION SHELF IS EMPTY
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Add key topics or summary notes for your upcoming exams. Select cards to generate targeted quizzes or click "AI Improve" to let AI refine your notes!
            </p>
            <button
              onClick={() => {
                setEditingConcept(null)
                setNewTitle('')
                setNewSubject('')
                setNewSummary('')
                setShowAddModal(true)
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
            >
              <Plus className="h-4 w-4" /> ADD YOUR FIRST REVISION NOTE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {concepts.map((concept) => {
              const isSelectedForQuiz = selectedForQuiz.includes(concept.id)
              const isImproving = improvingNoteId === concept.id

              return (
                <motion.div
                  key={concept.id}
                  layout
                  className={`group relative flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 backdrop-blur-xl ${
                    isSelectedForQuiz
                      ? 'border-violet-500 bg-[#0e0c24] shadow-[0_0_30px_rgba(139,92,246,0.25)] ring-1 ring-violet-500'
                      : 'border-white/10 bg-[#0d0c1d] hover:border-violet-500/40 hover:bg-[#100e28]'
                  }`}
                >
                  <div>
                    {/* Header Row: Quiz Checkbox + Subject + Actions */}
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                      <button
                        onClick={(e) => toggleSelectForQuiz(concept.id, e)}
                        className={`flex items-center gap-1.5 text-xs font-bold font-mono transition-colors ${
                          isSelectedForQuiz ? 'text-violet-300' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {isSelectedForQuiz ? (
                          <CheckSquare className="h-4 w-4 text-violet-400" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-600" />
                        )}
                        <span>QUIZ</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleDifficulty(e, concept)}
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                            concept.difficulty === 'Hard'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {concept.difficulty}
                        </button>

                        <button
                          onClick={(e) => handleOpenEdit(e, concept)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit Note"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteConcept(e, concept.id)}
                          className="p-1 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Remove concept"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subject Tag */}
                    <div className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase mb-1">
                      {concept.subject}
                    </div>

                    {/* Concept Title */}
                    <h3 className="text-base font-black tracking-wide text-white uppercase mb-2">
                      {concept.title}
                    </h3>

                    {/* Concept Summary */}
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed max-h-40 overflow-y-auto pr-1">
                      {concept.summary}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={(e) => handleAiImproveNote(e, concept)}
                      disabled={isImproving}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition-all"
                    >
                      {isImproving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="h-3.5 w-3.5" />
                      )}
                      {isImproving ? 'ENHANCING NOTES...' : '✨ AI IMPROVE NOTES'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleExplainText(e, concept)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-600/20 py-2 text-[10px] font-extrabold uppercase tracking-wider text-violet-300 hover:bg-violet-600 hover:text-white transition-all"
                      >
                        <MessageSquareText className="h-3 w-3" /> EXPLAIN
                      </button>

                      <button
                        onClick={(e) => handleFindYoutube(e, concept)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-600/20 py-2 text-[10px] font-extrabold uppercase tracking-wider text-rose-300 hover:bg-rose-600 hover:text-white transition-all"
                      >
                        <Video className="h-3 w-3 fill-current" /> YOUTUBE
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Mascot AI Text Explanation Modal */}
      <AnimatePresence>
        {explainingConceptId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExplainingConceptId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-4xl rounded-3xl border border-violet-500/40 bg-[#0e0c24] p-6 sm:p-8 shadow-[0_0_80px_rgba(139,92,246,0.3)] space-y-6 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-5 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-600/20 text-3xl shadow-[0_0_20px_rgba(139,92,246,0.4)] shrink-0">
                    🦉
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base sm:text-lg uppercase tracking-wider text-white">
                        BYTE AI — INTELLECTUAL COMPASS
                      </h4>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 uppercase">
                        Active Summarizer
                      </span>
                    </div>
                    {explainingConcept && (
                      <div className="text-xs sm:text-sm font-bold text-violet-300 uppercase mt-0.5">
                        {explainingConcept.title} <span className="text-zinc-500">•</span> {explainingConcept.subject}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {explainingConcept && (
                    <button
                      onClick={(e) => handleExplainText(e, explainingConcept, true)}
                      disabled={loadingExplainId === explainingConceptId}
                      className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-950/40 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-900/40 transition-all disabled:opacity-50"
                      title="Re-run AI summarization"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" /> RE-SUMMARIZE
                    </button>
                  )}

                  <button
                    onClick={() => setExplainingConceptId(null)}
                    className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              {loadingExplainId === explainingConceptId ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
                    <Sparkles className="h-5 w-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <span className="text-sm text-zinc-200 font-sans font-semibold">
                    Synthesizing concise high-yield summary for &quot;{explainingConcept?.title}&quot;...
                  </span>
                </div>
              ) : explanationMap[explainingConceptId]?.error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300 flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold uppercase tracking-wider">Summary Generation Failed</div>
                    <div className="text-xs text-rose-200/80 font-sans mt-1">
                      {explanationMap[explainingConceptId]?.error}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 max-h-[65vh]">
                  {/* Rich Section Cards */}
                  <div className="space-y-4 font-sans text-sm leading-relaxed">
                    {(() => {
                      const text = explanationMap[explainingConceptId]?.text || ''
                      const sections = text.split(/(?=###\s+)/g).filter(Boolean)

                      if (sections.length <= 1) {
                        const paragraphs = text.split('\n\n').filter(Boolean)
                        return paragraphs.map((p, idx) => (
                          <div key={idx} className="rounded-2xl border border-white/10 bg-[#070712] p-5 text-zinc-100 leading-relaxed text-sm">
                            {p.split('\n').map((line, lIdx) => (
                              <p key={lIdx} className={line.startsWith('•') || line.startsWith('-') ? 'ml-3 my-1.5 text-zinc-200 font-medium' : 'my-1'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        ))
                      }

                      return sections.map((sec, idx) => {
                        const lines = sec.trim().split('\n')
                        const header = lines[0].replace(/^###\s+/, '').trim()
                        const bodyLines = lines.slice(1).join('\n').trim()

                        let cardStyle = 'border-violet-500/30 bg-violet-950/25 shadow-[0_0_30px_rgba(139,92,246,0.1)]'
                        let icon = '💡'
                        let badgeColor = 'text-violet-300'

                        if (header.includes('Intuition') || header.includes('ELI5') || header.includes('Overview')) {
                          cardStyle = 'border-violet-500/35 bg-violet-950/35 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                          icon = '💡'
                          badgeColor = 'text-violet-300'
                        } else if (header.includes('Analogy')) {
                          cardStyle = 'border-emerald-500/35 bg-emerald-950/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                          icon = '🧩'
                          badgeColor = 'text-emerald-300'
                        } else if (header.includes('Takeaways') || header.includes('Principles') || header.includes('Mechanics')) {
                          cardStyle = 'border-cyan-500/35 bg-cyan-950/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
                          icon = '🎯'
                          badgeColor = 'text-cyan-300'
                        } else if (header.includes('Tip') || header.includes('Strategy') || header.includes('Gotchas')) {
                          cardStyle = 'border-amber-500/35 bg-amber-950/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
                          icon = '🦉'
                          badgeColor = 'text-amber-300'
                        }

                        return (
                          <div key={idx} className={`rounded-2xl border p-5 ${cardStyle}`}>
                            <div className={`flex items-center gap-2.5 text-xs font-black uppercase tracking-widest mb-3 ${badgeColor}`}>
                              <span className="text-base">{icon}</span> {header}
                            </div>
                            <div className="text-zinc-100 space-y-2.5 text-sm font-sans">
                              {bodyLines.split('\n').map((line, lIdx) => {
                                const trimmed = line.trim()
                                if (!trimmed) return null
                                if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
                                  return (
                                    <div key={lIdx} className="flex items-start gap-3 pl-1.5 text-zinc-200">
                                      <span className="text-violet-400 mt-1 font-bold">•</span>
                                      <span className="flex-1 leading-relaxed">{trimmed.replace(/^[•\-\d\.]\s*/, '')}</span>
                                    </div>
                                  )
                                }
                                return <p key={lIdx} className="text-zinc-100 leading-relaxed">{line}</p>
                              })}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>

                  {/* Action Bar Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        const text = explanationMap[explainingConceptId]?.text || ''
                        navigator.clipboard.writeText(text)
                        toast('📋 Copied summary to clipboard!', 'success')
                      }}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-white/10 transition-all"
                    >
                      <MessageSquareText className="h-4 w-4 text-violet-400" /> COPY SUMMARY
                    </button>

                    <div className="flex items-center gap-3">
                      {explainingConcept && (
                        <button
                          onClick={(e) => {
                            const c = explainingConcept
                            setExplainingConceptId(null)
                            handleFindYoutube(e, c)
                          }}
                          className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-xs font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-900/40 transition-all"
                        >
                          <Video className="h-4 w-4" /> WATCH TUTORIALS
                        </button>
                      )}

                      {explainingConcept && (
                        <button
                          onClick={() => {
                            const topic = explainingConcept.title
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('quiz_selected_topics', JSON.stringify([topic]))
                            }
                            router.push(`/quest-log?topics=${encodeURIComponent(topic)}`)
                          }}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-violet-600/30 hover:brightness-110 transition-all"
                        >
                          <Swords className="h-4 w-4" /> PRACTICE QUIZ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* YouTube Video Search Drawer */}
      <AnimatePresence>
        {youtubeConceptId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setYoutubeConceptId(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-xl rounded-3xl border border-rose-500/40 bg-[#0d0c1d] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <Video className="h-5 w-5 fill-current" />
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    RECOMMENDED YOUTUBE TUTORIALS
                  </h4>
                </div>
                <button
                  onClick={() => setYoutubeConceptId(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {youtubeConcept && (
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-rose-300 uppercase">
                    {youtubeConcept.title} — {youtubeConcept.subject}
                  </div>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${youtubeConcept.title} ${youtubeConcept.subject} tutorial explanation`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Open in YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {loadingYoutubeId === youtubeConceptId ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
                  <span className="text-xs text-zinc-400 font-sans">
                    Searching YouTube for top educational explanations...
                  </span>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto font-sans">
                  {youtubeMap[youtubeConceptId]?.map((vid, idx) => {
                    const videoLink = vid.url || vid.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${youtubeConcept?.title || 'academic'} tutorial`)}`
                    return (
                      <a
                        key={idx}
                        href={videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#070712] p-3.5 hover:border-rose-500/50 hover:bg-[#130f28] transition-all group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                          <Video className="h-5 w-5 fill-current" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-extrabold text-white group-hover:text-rose-300 line-clamp-1">
                            {vid.title}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">
                            {vid.description || vid.channelTitle}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-white shrink-0 mt-1" />
                      </a>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Concept Card Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddModal(false)
                setEditingConcept(null)
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-violet-500/40 bg-[#0d0c1d] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  {editingConcept ? 'EDIT REVISION NOTE' : 'ADD NEW REVISION NOTE'}
                </h4>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingConcept(null)
                  }}
                  className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConcept} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase">
                    CONCEPT TITLE
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. BACKPROPAGATION"
                    className="w-full rounded-xl border border-white/10 bg-[#070712] px-3.5 py-2.5 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase">
                    SUBJECT / CATEGORY
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. NEURAL NETWORKS"
                    className="w-full rounded-xl border border-white/10 bg-[#070712] px-3.5 py-2.5 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase">
                    KEY SUMMARY / NOTES
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Brief explanation or key formula to remember..."
                    className="w-full rounded-xl border border-white/10 bg-[#070712] px-3.5 py-2.5 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingConcept}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
                >
                  {savingConcept ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {editingConcept ? 'SAVE CHANGES' : 'SAVE TO REVISION SHELF'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RevisionShelf
