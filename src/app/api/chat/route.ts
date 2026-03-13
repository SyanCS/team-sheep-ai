import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai'
import { chatModel } from '@/lib/ai/client'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { formatContext, retrieveRelevantChunks, type RetrievedChunk } from '@/lib/rag/retrieval'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    // Build a context-aware query from the last 3 user turns so follow-up
    // questions ("how many sets?") still retrieve the right documents.
    const query = messages
      .filter((m) => m.role === 'user')
      .slice(-3)
      .flatMap((m) =>
        m.parts.filter((p) => p.type === 'text').map((p) => (p.type === 'text' ? p.text : ''))
      )
      .join(' ')

    let chunks: RetrievedChunk[] = []
    try {
      chunks = await retrieveRelevantChunks(query)
    } catch {
      // DB down — chat still works with general knowledge
    }

    const context = formatContext(chunks)

    // Deduplicate sources by document name before attaching them to the stream.
    const uniqueSources = [...new Map(chunks.map((c) => [c.documentName, c.documentName])).values()]

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Write source-document parts first so the client knows which files
        // were consulted, even before the text starts streaming.
        for (const name of uniqueSources) {
          writer.write({
            type: 'source-document',
            sourceId: name,
            mediaType: 'text/plain',
            title: name,
          })
        }

        const result = streamText({
          model: chatModel,
          system: buildSystemPrompt(context),
          messages: await convertToModelMessages(messages),
        })

        writer.merge(result.toUIMessageStream())
      },
      onError(error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        if (
          msg.includes('rate-limit') ||
          msg.includes('rate_limit') ||
          msg.includes('429') ||
          msg.includes('rate-limited')
        ) {
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

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    console.error('[api/chat]', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
