import { ingestDocument } from '@/lib/rag/ingest'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'text/markdown']

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Unsupported file type: ${file.type}. Upload a PDF or plain text file.` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: 'File exceeds the 10 MB limit.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await ingestDocument(buffer, file.name, file.type)

    return Response.json({
      success: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return Response.json({ error: message }, { status: 500 })
  }
}
