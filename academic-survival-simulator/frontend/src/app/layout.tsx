import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'
import NavbarServer from '@/components/NavbarServer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Academic Survival Simulator — ML GPA Predictor & AI Companion',
  description:
    'S-Curve GPA calculation engine, Machine Learning performance trajectory predictor, stamina gamification engine, and AI Mascot companion.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">
        <ToastProvider>
          <NavbarServer />
          <div className="flex-1">{children}</div>
        </ToastProvider>
      </body>
    </html>
  )
}
