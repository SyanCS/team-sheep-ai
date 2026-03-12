import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'

export async function GET() {
  try {
    const docs = await db
      .select({
        id: documents.id,
        name: documents.name,
        fileType: documents.fileType,
        sizeBytes: documents.sizeBytes,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .orderBy(desc(documents.createdAt))

    return Response.json({ documents: docs })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return Response.json({ error: message }, { status: 500 })
  }
}
