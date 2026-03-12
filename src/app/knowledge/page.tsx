import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { DocumentList } from '@/components/knowledge/DocumentList'
import { DocumentUpload } from '@/components/knowledge/DocumentUpload'

// This is a Server Component — it queries the database directly,
// no API call needed. When router.refresh() is called from a client
// component, Next.js re-runs this function to get fresh data.
async function getDocuments() {
  return db
    .select()
    .from(documents)
    .orderBy(desc(documents.createdAt))
}

export default async function KnowledgePage() {
  const docs = await getDocuments()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload documents to feed Team Sheep AI. Supported formats: PDF, TXT, Markdown.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Upload
        </h2>
        <DocumentUpload />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Documents
          </h2>
          <span className="text-xs text-muted-foreground">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="border rounded-xl px-4">
          <DocumentList documents={docs} />
        </div>
      </section>
    </div>
  )
}
