import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, CheckCircle2, Loader2, Trash2, AlertCircle, Database } from 'lucide-react'

interface DocumentFile {
  id: string
  filename: string
  status: 'processing' | 'indexed' | 'failed'
  created_at: string
}

export default function Knowledge() {
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (err) {
      console.error("Error fetching documents:", err)
    }
  }

  useEffect(() => {
    fetchDocuments()
    const timer = setInterval(() => {
      fetchDocuments()
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0])
    }
  }

  const uploadFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
      setError("Only PDF specifications or documents are supported.")
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Upload failed")
      }

      const newDoc = await response.json()
      setDocuments(prev => [newDoc, ...prev])
    } catch (err: any) {
      setError(err.message || "Failed to upload document. Please retry.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from the vector database?")) return

    try {
      const response = await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id))
      }
    } catch (err) {
      console.error("Error deleting document:", err)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="animate-glow">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Knowledge Base Indexing
        </h2>
        <p className="text-slate-400 mt-1.5 text-sm">
          Upload PDF specs and manuals to chunk, embed, and index them into our local FAISS vector store.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`glass-card border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-indigo-400 bg-indigo-950/20' 
            : 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/10'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden" 
        />
        <div className="w-14 h-14 mx-auto mb-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center transition-all">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Drag & Drop PDF Specifications</h3>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-2">
          Supports design specs, product guides, and database definitions.
        </p>
        <span className="text-xs text-indigo-400 font-semibold underline">Browse local files</span>
      </div>

      {/* Vector Files Manager */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 px-2">
          <Database className="w-4.5 h-4.5 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-300">Active Knowledge Indexes ({documents.length})</span>
        </div>

        {documents.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-slate-800/40 text-slate-500 text-sm">
            No active knowledge files indexed. Upload a specification PDF to power the RAG chat.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="glass-card rounded-2xl p-5 border border-slate-800/40 flex items-center justify-between gap-4 transition-all duration-300 hover:border-slate-700/60"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate pr-2" title={doc.filename}>
                      {doc.filename}
                    </h4>
                    <p className="text-xs text-slate-550 mt-1">
                      Uploaded {doc.created_at}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {doc.status === 'indexed' ? (
                    <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Indexed</span>
                    </div>
                  ) : doc.status === 'failed' ? (
                    <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      <span>Failed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Vectorizing</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-455 hover:bg-slate-900/40 transition-all"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
