'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom whenever messages change or tokens stream in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  function handleSubmit() {
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto pr-1">
        <MessageList messages={messages} isStreaming={status === 'submitted'} />
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
