import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Meetings from './pages/Meetings'
import Knowledge from './pages/Knowledge'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'meetings' | 'knowledge'>('dashboard')

  return (
    <div className="flex min-h-screen bg-[#060814]">
      {/* Sidebar Navigation */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-y-auto px-6 py-8 md:px-10 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {currentPage === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} />}
          {currentPage === 'meetings' && <Meetings />}
          {currentPage === 'knowledge' && <Knowledge />}
        </div>
      </main>
    </div>
  )
}
