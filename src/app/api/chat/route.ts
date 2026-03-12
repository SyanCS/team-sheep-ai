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

    // Retrieve the most relevant document chunks for this query
    const chunks = await retrieveRelevantChunks(query)
    const context = formatContext(chunks)

    const result = streamText({
      model: chatModel,
      system: buildSystemPrompt(context),
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return new Response(message, { status: 500 })
  }
}
