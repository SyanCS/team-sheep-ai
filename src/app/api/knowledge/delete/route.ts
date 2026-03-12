import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Document ID is required.' }, { status: 400 })
    }

    await db.delete(documents).where(eq(documents.id, id))

    // document_chunks are deleted automatically via ON DELETE CASCADE
    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return Response.json({ error: message }, { status: 500 })
  }
}
