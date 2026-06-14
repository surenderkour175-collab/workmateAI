import { LayoutDashboard, Mic, Database, Layers } from 'lucide-react'

interface SidebarProps {
  currentPage: 'dashboard' | 'meetings' | 'knowledge'
  setCurrentPage: (page: 'dashboard' | 'meetings' | 'knowledge') => void
}

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meetings', label: 'Meetings', icon: Mic },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  ] as const

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col h-screen sticky top-0 bg-[#0a0c1b] border-r border-slate-850 p-6 justify-between">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              WorkMate AI
            </h1>
            <p className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">MS HACKATHON</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = currentPage === link.id
            return (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 shadow-md shadow-indigo-900/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-2 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-350 group-hover:scale-105 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-350'}`} />
                <span className="font-medium text-sm">{link.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Microsoft Hackathon Status Badge */}
      <div className="glass-card rounded-xl p-4 border border-slate-800/40">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-200">Azure Service Health</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Integrated with Azure OpenAI, local FAISS vectors, and OpenAI Whisper.
        </p>
      </div>
    </aside>
  )
}
