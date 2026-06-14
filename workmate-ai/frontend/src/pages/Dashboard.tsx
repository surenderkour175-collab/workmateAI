import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Mic, FileText, CheckCircle, MessageSquare } from 'lucide-react'

interface DashboardProps {
  setCurrentPage: (page: 'dashboard' | 'meetings' | 'knowledge') => void
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  sources?: string[]
}

export default function Dashboard({ setCurrentPage }: DashboardProps) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hello! I am WorkMate AI. I can search across all uploaded meetings and documents to answer questions and extract details. Ask me anything, or try one of the suggested prompts below!",
    }
  ])
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState({
    meetings: 0,
    documents: 0,
    actionItems: 0
  })

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Fetch counts from Backend
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [meetRes, docRes] = await Promise.all([
          fetch('http://localhost:8000/api/meetings'),
          fetch('http://localhost:8000/api/documents')
        ])
        if (meetRes.ok && docRes.ok) {
          const meetingsList = await meetRes.json()
          const docsList = await docRes.json()
          
          let actionItemsCount = 0
          meetingsList.forEach((m: any) => {
            if (m.action_items) {
              actionItemsCount += m.action_items.length
            }
          })

          setMetrics({
            meetings: meetingsList.length,
            documents: docsList.length,
            actionItems: actionItemsCount
          })
        }
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err)
      }
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return
    
    const newMsg: Message = { role: 'user', text: textToSend }
    setMessages(prev => [...prev, newMsg])
    setQuery('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: data.answer,
          sources: data.sources || []
        }])
      } else {
        throw new Error("Chat request failed")
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Sorry, I encountered an issue fetching answers. Please verify the backend is running.",
        sources: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const suggestedPrompts = [
    "What database did we agree to use, and when does Sarah need it deployed?",
    "Show me a list of all action items assigned to Sarah."
  ]

  return (
    <div className="flex flex-col gap-8 animate-glow">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Workspace Intelligence
        </h2>
        <p className="text-slate-400 mt-1.5 text-sm">
          Ask questions, summarize audio synchronizations, and query the vector store index.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Meetings Card */}
        <div 
          onClick={() => setCurrentPage('meetings')}
          className="glass-card glass-card-hover rounded-2xl p-6 cursor-pointer transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Processed Meetings</span>
            <span className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors">{metrics.meetings}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/25 transition-all">
            <Mic className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        {/* Documents Card */}
        <div 
          onClick={() => setCurrentPage('knowledge')}
          className="glass-card glass-card-hover rounded-2xl p-6 cursor-pointer transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Vector Documents</span>
            <span className="text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors">{metrics.documents}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/25 transition-all">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* Action Items Card */}
        <div 
          onClick={() => setCurrentPage('meetings')}
          className="glass-card glass-card-hover rounded-2xl p-6 cursor-pointer transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Action Items</span>
            <span className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">{metrics.actionItems}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/25 transition-all">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Global RAG Chat Box */}
      <div className="glass-card rounded-2xl border border-slate-800/40 overflow-hidden flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/35 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-white text-sm">Unified Global RAG Chat</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25">
            <Sparkles className="w-3.5 h-3.5 text-indigo-450" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">AI Search Active</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                  : 'bg-[#0f1326] border border-slate-800/80 text-slate-300'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cited Sources:</span>
                    {msg.sources.map((src, sIdx) => (
                      <span 
                        key={sIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-cyan-400 font-semibold"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-5 py-3.5 bg-[#0f1326] border border-slate-800/80 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-slate-500 font-medium">WorkMate is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts Block */}
        <div className="px-6 py-2 bg-slate-900/20 border-t border-slate-800/40 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Suggested:</span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-cyan-400 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/30 rounded-lg px-3 py-1 transition-all duration-200 text-left"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/30 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(query)}
            placeholder="Ask a question about database specifications, deployment timelines, action items..."
            disabled={loading}
            className="flex-1 bg-[#090b16] border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          <button
            onClick={() => handleSend(query)}
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  )
}
