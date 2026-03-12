import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { chatModel } from '@/lib/ai/client'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { formatContext, retrieveRelevantChunks } from '@/lib/rag/retrieval'

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    // Extract the latest user message to use as the retrieval query
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    const query = lastUserMessage
      ? typeof lastUserMessage.content === 'string'
        ? lastUserMessage.content
        : ''
      : ''

    // Retrieve relevant chunks when DB is available; otherwise use empty context
    let chunks: Awaited<ReturnType<typeof retrieveRelevantChunks>> = []
    try {
      chunks = await retrieveRelevantChunks(query)
    } catch {
      // DB down or no embeddings — chat still works with general knowledge
    }
    const context = formatContext(chunks)

    const result = streamText({
      model: chatModel,
      system: buildSystemPrompt(context),
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[api/chat]', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
