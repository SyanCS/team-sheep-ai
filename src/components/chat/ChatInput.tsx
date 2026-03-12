import { type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  input: string
  isDisabled: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  isStreaming: boolean
}

export function ChatInput({ input, isDisabled, onChange, onSubmit, onStop, isStreaming }: ChatInputProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isDisabled && input.trim()) onSubmit()
    }
  }

  return (
    <div className="border-t bg-background pt-4">
      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about workouts, nutrition, recovery… (Enter to send)"
          disabled={isDisabled && !isStreaming}
          rows={1}
          className="resize-none min-h-[44px] max-h-32 leading-relaxed"
        />
        {isStreaming ? (
          <Button variant="outline" size="icon" onClick={onStop} className="shrink-0 h-11 w-11">
            <StopIcon className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            disabled={isDisabled || !input.trim()}
            onClick={onSubmit}
            className="shrink-0 h-11 w-11"
          >
            <SendIcon className="size-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Team Sheep AI can make mistakes. Always verify fitness advice with a professional.
      </p>
    </div>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
    </svg>
  )
}
