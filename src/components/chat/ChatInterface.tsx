'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  // Show the typing indicator while waiting for a response, and keep it
  // visible during early streaming if the assistant message has no text yet
  // (source-document chunks arrive before text, which flips status to
  // 'streaming' immediately, causing the dots to vanish before text appears).
  const lastMessage = messages.at(-1)
  const assistantHasText =
    lastMessage?.role === 'assistant' &&
    lastMessage.parts.some((p) => p.type === 'text' && p.text.length > 0)
  const showTypingIndicator =
    status === 'submitted' || (status === 'streaming' && !assistantHasText)

  // Auto-scroll to bottom whenever messages change or tokens stream in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status, error])

  function handleSubmit() {
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto pr-1">
        <MessageList
          messages={messages}
          isStreaming={showTypingIndicator}
          error={error}
        />
        <div ref={bottomRef} />
      </div>

      {/* Fixed input at the bottom */}
      <ChatInput
        input={input}
        isDisabled={isStreaming}
        isStreaming={isStreaming}
        onChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
      />
    </div>
  )
}
