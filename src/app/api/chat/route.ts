import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { chatModel } from '@/lib/ai/client'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { formatContext, retrieveRelevantChunks } from '@/lib/rag/retrieval'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    const query =
      lastUserMessage?.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p.type === 'text' ? p.text : ''))
        .join(' ') ?? ''

    let chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>> = []
    try {
      chunks = await retrieveRelevantChunks(query)
    } catch {
      // DB down — chat still works with general knowledge
    }

    const context = formatContext(chunks)

    const result = streamText({
      model: chatModel,
      system: buildSystemPrompt(context),
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse({
      onError(error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        if (msg.includes('rate-limit') || msg.includes('rate_limit') || msg.includes('429') || msg.includes('rate-limited')) {
          return 'The AI model is temporarily rate-limited. Please wait a moment and try again.'
        }
        if (msg.includes('timeout') || msg.includes('timed out')) {
          return 'The request timed out. Please try again.'
        }
        if (msg.includes('context length') || msg.includes('token')) {
          return 'Your conversation is too long. Please start a new chat.'
        }
        return 'Something went wrong while generating a response. Please try again.'
      },
    })
  } catch (error) {
    console.error('[api/chat]', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
