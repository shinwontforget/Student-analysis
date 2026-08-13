'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X, Zap } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'premium'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// Global singleton pattern for use outside of React components
let globalToast: ((message: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  if (globalToast) globalToast(message, type)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  // Register global handler
  useEffect(() => {
    globalToast = addToast
    return () => { globalToast = null }
  }, [addToast])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
    error:   <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />,
    info:    <Info className="h-4 w-4 text-violet-400 shrink-0" />,
    premium: <Zap className="h-4 w-4 text-amber-400 shrink-0 fill-amber-400" />,
  }

  const borders: Record<ToastType, string> = {
    success: 'border-emerald-500/40 bg-emerald-950/60',
    error:   'border-rose-500/40 bg-rose-950/60',
    info:    'border-violet-500/40 bg-violet-950/60',
    premium: 'border-amber-500/40 bg-amber-950/60',
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs font-mono backdrop-blur-xl shadow-2xl ${borders[t.type]}`}
            >
              {icons[t.type]}
              <span className="text-zinc-100 text-[11px] leading-relaxed flex-1">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="text-zinc-500 hover:text-zinc-300 mt-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
