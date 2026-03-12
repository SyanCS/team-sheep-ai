'use client'

import type { UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageListProps {
  messages: UIMessage[]
  isStreaming: boolean
  error?: Error
}

export function MessageList({ messages, isStreaming, error }: MessageListProps) {
  if (messages.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
        <DumbbellIcon className="size-10 opacity-30" />
        <div>
          <p className="font-medium text-foreground">Ask Team Sheep AI</p>
          <p className="text-sm mt-1">
            Ask about workouts, training plans, nutrition, or recovery.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'assistant' && (
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <DumbbellIcon className="size-3.5 text-primary" />
            </div>
          )}

          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted text-foreground rounded-bl-sm'
            }`}
          >
            {message.role === 'user' ? (
              <span>
                {message.parts.map((part, i) =>
                  part.type === 'text' ? <span key={i}>{part.text}</span> : null
                )}
              </span>
            ) : (
              <div>
                {message.parts.map((part, i) =>
                  part.type === 'text' ? (
                    <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {part.text}
                    </ReactMarkdown>
                  ) : null
                )}
              </div>
            )}
          </div>

          {message.role === 'user' && (
            <div className="size-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
              <UserIcon className="size-3.5 text-secondary-foreground" />
            </div>
          )}
        </div>
      ))}

      {isStreaming && (
        <div className="flex gap-3 justify-start">
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <DumbbellIcon className="size-3.5 text-primary" />
          </div>
          <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
            <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-3 justify-start">
          <div className="size-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertIcon className="size-3.5 text-destructive" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="font-medium mb-0.5">Something went wrong</p>
            <p className="text-destructive/80">{friendlyError(error)}</p>
            <p className="text-xs text-destructive/60 mt-1">Type a new message to try again.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Tailwind-styled markdown component overrides
const markdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
  code: ({ children }) => (
    <code className="bg-background/60 rounded px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-background/60 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground my-2">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-xs border-collapse w-full">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border px-2 py-1 bg-background/40 font-semibold text-left">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-2 py-1">{children}</td>
  ),
  hr: () => <hr className="border-muted-foreground/20 my-2" />,
}

function friendlyError(error: Error): string {
  const msg = error.message ?? ''
  if (msg.includes('rate-limit') || msg.includes('rate_limit') || msg.includes('429') || msg.includes('rate-limited')) {
    return 'The AI model is temporarily rate-limited. Please wait a moment and try again.'
  }
  if (msg.includes('timeout') || msg.includes('timed out')) return 'The request timed out. Please try again.'
  if (msg.includes('context length') || msg.includes('token')) return 'Your conversation is too long. Please start a new chat.'
  if (msg) return msg
  return 'An unexpected error occurred. Please try again.'
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v9.75h-.75a2.25 2.25 0 0 1-2.25-2.25v-5.25a2.25 2.25 0 0 1 2.25-2.25ZM17.25 6.75h-.75v9.75h.75a2.25 2.25 0 0 0 2.25-2.25v-5.25a2.25 2.25 0 0 0-2.25-2.25ZM9 6.75h6v10.5H9V6.75Z" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

