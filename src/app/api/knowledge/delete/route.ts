import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Document ID is required.' }, { status: 400 })
    }

    // Remove chunks from the LangChain vector store table (metadata JSONB filter)
    await db.execute(
      sql`DELETE FROM langchain_chunks WHERE metadata->>'documentId' = ${id}`
    )

    // Remove document metadata row
    await db.delete(documents).where(eq(documents.id, id))

    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return Response.json({ error: message }, { status: 500 })
  }
}
