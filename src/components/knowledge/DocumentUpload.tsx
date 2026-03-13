'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export function DocumentUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [message, setMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  function uploadFile(file: File) {
    setStatus('uploading')
    setUploadProgress(0)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    // Track how much of the file has been sent to the server.
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    // Transfer complete — server is now parsing + embedding the document.
    xhr.upload.onload = () => {
      setStatus('processing')
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus('success')
          setMessage(`"${file.name}" ingested — ${data.chunkCount} chunks stored.`)
          router.refresh()
        } else {
          setStatus('error')
          setMessage(data.error ?? 'Upload failed.')
        }
      } catch {
        setStatus('error')
        setMessage('Unexpected server response.')
      }
    }

    xhr.onerror = () => {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }

    xhr.open('POST', '/api/knowledge/upload')
    xhr.send(formData)
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const isBusy = status === 'uploading' || status === 'processing'

  return (
    <div className="space-y-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isBusy && inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/40'}
          ${isBusy ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <UploadIcon className="size-10 opacity-40" />
          {isBusy ? (
            <p className="text-sm font-medium">
              {status === 'uploading' ? 'Uploading…' : 'Embedding document…'}
            </p>
          ) : (
            <>
              <p className="text-sm font-medium">Drop a file here or click to browse</p>
              <p className="text-xs">PDF, TXT, or Markdown — max 10 MB</p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar — shown during upload and server-side processing */}
      {isBusy && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          {status === 'uploading' ? (
            // Determinate: tracks actual bytes sent
            <div
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          ) : (
            // Indeterminate: server is chunking + embedding
            <div className="h-full bg-primary rounded-full w-1/3 animate-[slide_1.4s_ease-in-out_infinite]" />
          )}
        </div>
      )}

      {status !== 'idle' && !isBusy && (
        <div
          className={`text-sm px-4 py-2.5 rounded-lg ${
            status === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
        className="w-full"
      >
        {isBusy ? (status === 'uploading' ? 'Uploading…' : 'Processing…') : 'Select file'}
      </Button>
    </div>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  )
}
