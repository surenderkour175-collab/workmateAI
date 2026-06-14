import { useState, useEffect, useRef } from 'react'
import { Upload, Mic, Clock, Check, AlertCircle, ChevronDown, ChevronUp, Trash2, Calendar, User } from 'lucide-react'

interface ActionItem {
  task: string
  owner: string
  due: string
}

interface Meeting {
  id: string
  filename: string
  status: 'processing' | 'completed' | 'failed'
  transcript?: string
  summary?: string
  action_items: ActionItem[]
  created_at: string
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMeetings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/meetings')
      if (response.ok) {
        const data = await response.json()
        setMeetings(data)
      }
    } catch (err) {
      console.error("Error fetching meetings:", err)
    }
  }

  useEffect(() => {
    fetchMeetings()
    const timer = setInterval(() => {
      fetchMeetings()
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/api/meetings/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Upload failed")
      }

      const newMeeting = await response.json()
      setMeetings(prev => [newMeeting, ...prev])
      setExpandedId(newMeeting.id)
    } catch (err: any) {
      setError(err.message || "Failed to upload audio file. Check format.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this meeting?")) return

    try {
      const response = await fetch(`http://localhost:8000/api/meetings/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setMeetings(prev => prev.filter(m => m.id !== id))
        if (expandedId === id) setExpandedId(null)
      }
    } catch (err) {
      console.error("Error deleting meeting:", err)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-glow">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Meeting Intelligence
          </h2>
          <p className="text-slate-400 mt-1.5 text-sm">
            Upload meeting audio syncs to transcribe, summarize, and extract action items instantly.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".mp3,.mp4,.wav,.m4a"
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 hover:from-cyan-400 hover:to-indigo-600 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Upload className="w-4.5 h-4.5" />
            <span>{uploading ? 'Processing Audio...' : 'Upload Sync Audio'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploading && (
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col gap-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Mic className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Transcribing Meeting Audio...</h3>
                <p className="text-xs text-slate-500">Converting voice to text via OpenAI Whisper</p>
              </div>
            </div>
            <span className="text-xs text-cyan-400 font-medium">Processing...</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 w-2/3 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="flex flex-col gap-4">
        {meetings.length === 0 && !uploading ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800/30">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-900/80 rounded-2xl flex items-center justify-center border border-slate-800">
              <Mic className="w-7 h-7 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Meetings Uploaded Yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Get started by uploading an MP3 or MP4 recording of your latest standup. We'll automatically generate summaries and parse actions.
            </p>
            <button
              onClick={handleUploadClick}
              className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all"
            >
              Select Audio File
            </button>
          </div>
        ) : (
          meetings.map((meeting) => {
            const isExpanded = expandedId === meeting.id
            return (
              <div 
                key={meeting.id}
                className={`glass-card rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-cyan-500/30 shadow-lg shadow-cyan-950/10' : 'border-slate-805'
                }`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(meeting.id)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      meeting.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : meeting.status === 'failed'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse'
                    }`}>
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{meeting.filename}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.created_at}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        <span className={`capitalize font-semibold ${
                          meeting.status === 'completed'
                            ? 'text-emerald-400'
                            : meeting.status === 'failed'
                            ? 'text-rose-455'
                            : 'text-cyan-400'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(meeting.id, e)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900/60 transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && meeting.status === 'completed' && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-900/40 bg-slate-900/5 flex flex-col gap-6">
                    <div>
                      <h5 className="text-xs text-cyan-400 font-bold tracking-wider uppercase mb-2.5">Meeting Summary & Decision Logs</h5>
                      <div className="text-slate-350 text-sm bg-[#090b16] border border-slate-850 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                        {meeting.summary}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs text-indigo-450 font-bold tracking-wider uppercase mb-2.5">Extracted Action Items ({meeting.action_items.length})</h5>
                      {meeting.action_items.length === 0 ? (
                        <p className="text-xs text-slate-500">No action items were detected in this meeting sync.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {meeting.action_items.map((action, aIdx) => (
                            <div 
                              key={aIdx} 
                              className="flex items-start gap-3.5 bg-[#0a0d1d] border border-slate-850 rounded-xl p-3.5 transition-all hover:bg-[#0f132a]"
                            >
                              <div className="w-5 h-5 mt-0.5 rounded-md bg-emerald-550/10 border border-emerald-500/30 flex items-center justify-center text-emerald-450 shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <span className="text-sm text-slate-200 leading-normal">{action.task}</span>
                                <div className="flex items-center gap-3.5 text-xs text-slate-500 shrink-0">
                                  <span className="flex items-center gap-1 bg-slate-850 border border-slate-800 rounded px-2 py-0.5">
                                    <User className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>{action.owner}</span>
                                  </span>
                                  <span className="flex items-center gap-1 bg-slate-850 border border-slate-800 rounded px-2 py-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{action.due}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <details className="group">
                      <summary className="text-xs text-slate-500 font-bold tracking-wider uppercase cursor-pointer hover:text-slate-350 transition-colors list-none flex items-center gap-1">
                        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        <span>View Raw Meeting Transcript</span>
                      </summary>
                      <div className="mt-2.5 text-xs text-slate-400 bg-[#070911] border border-slate-850 rounded-xl p-4 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {meeting.transcript}
                      </div>
                    </details>
                  </div>
                )}

                {isExpanded && meeting.status === 'processing' && (
                  <div className="px-6 pb-6 pt-4 border-t border-slate-900/40 bg-slate-900/10 text-center">
                    <p className="text-sm text-slate-400 animate-pulse">
                      Generating transcript summaries and parsing action items. This usually takes a moment...
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
