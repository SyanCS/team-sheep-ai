import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Team Sheep AI',
  description: 'Your AI-powered fitness assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen bg-background overflow-hidden">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 flex flex-col bg-zinc-950 text-zinc-100 border-r border-zinc-800">
            {/* Brand */}
            <div className="px-4 py-5 border-b border-zinc-800">
              <Link href="/" className="flex items-center gap-3">
                <div className="size-9 rounded-xl overflow-hidden shrink-0 ring-1 ring-zinc-700">
                  <Image src="/logo.png" alt="Team Sheep AI" width={36} height={36} className="object-cover w-full h-full" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-white">Team Sheep</p>
                  <p className="text-xs text-zinc-400">Fitness AI</p>
                </div>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors group"
              >
                <ChatBubbleIcon className="size-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                Chat
              </Link>
              <Link
                href="/knowledge"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors group"
              >
                <BookIcon className="size-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                Knowledge
              </Link>
            </nav>

            {/* Footer tag */}
            <div className="px-4 py-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-600">Powered by OpenRouter</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  )
}
