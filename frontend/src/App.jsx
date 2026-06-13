import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, Building2, Users, Shuffle, ClipboardPaste,
  Bot, CreditCard, Sparkles, Menu, X, ChevronRight, Zap
} from 'lucide-react'
import Dashboard    from './pages/Dashboard'
import Listings     from './pages/Listings'
import Queries      from './pages/Queries'
import Matches      from './pages/Matches'
import QuickPaste   from './pages/QuickPaste'
import ScraperPage  from './pages/Scraper'
import AISettings   from './pages/AISettings'
import './index.css'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',     end: true },
  { to: '/listings',   icon: Building2,       label: 'Listings'              },
  { to: '/queries',    icon: Users,           label: 'Client queries'        },
  { to: '/matches',    icon: Shuffle,         label: 'Matches'               },
  { to: '/paste',      icon: ClipboardPaste,  label: 'Quick paste'           },
  { to: '/scraper',    icon: Bot,             label: 'Scraper'               },
  { to: '/ai',         icon: Sparkles,        label: 'AI settings'           },
]

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
        style={{background:'linear-gradient(180deg,#13132b 0%,#0f0f1a 100%)',borderRight:'1px solid rgba(99,102,241,0.12)'}}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{borderColor:'rgba(99,102,241,0.12)'}}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',boxShadow:'0 0 20px rgba(99,102,241,0.5)'}}>
            🏠
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">NL Rent Finder</div>
            <div className="text-xs text-slate-500 mt-0.5">Netherlands · AI Powered</div>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white lg:hidden"><X size={18}/></button>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 mx-4 my-3 px-3 py-2 rounded-lg" style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.15)'}}>
          <div className="glow-dot"/>
          <span className="text-xs text-emerald-400 font-medium">Scraper active</span>
          <Zap size={12} className="text-emerald-400 ml-auto"/>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({to,icon:Icon,label,end}) => (
            <NavLink key={to} to={to} end={end} onClick={onClose}
              className={({isActive}) => `nav-item ${isActive?'active':''}`}>
              <Icon size={16}/>
              <span>{label}</span>
              {label === 'AI settings' && (
                <span className="ml-auto badge badge-purple text-[10px] px-1.5 py-0.5">GPT</span>
              )}
            </NavLink>
          ))}
        </nav>
        {/* Bottom */}
        <div className="p-4 border-t" style={{borderColor:'rgba(99,102,241,0.1)'}}>
          <div className="glass-card p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Monthly AI cost</div>
            <div className="text-lg font-bold" style={{background:'linear-gradient(135deg,#6366f1,#2dd4bf)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>~€0.60</div>
            <div className="text-xs text-slate-600 mt-0.5">OpenAI gpt-4o-mini</div>
          </div>
        </div>
      </aside>
    </>
  )
}

function Topbar({ onMenu, title, subtitle }) {
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b" style={{background:'rgba(15,15,26,0.8)',backdropFilter:'blur(12px)',borderColor:'rgba(99,102,241,0.1)',position:'sticky',top:0,zIndex:20}}>
      <button onClick={onMenu} className="lg:hidden text-slate-400 hover:text-white">
        <Menu size={20}/>
      </button>
      <div className="flex-1">
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="badge badge-blue"><Sparkles size={10}/>AI ready</div>
      </div>
    </header>
  )
}

function PageWrapper({ title, subtitle, children }) {
  const loc = useLocation()
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <Topbar title={title} subtitle={subtitle}/>
      <main key={loc.pathname} className="flex-1 p-6 page-enter overflow-auto">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden" style={{background:'#0f0f1a'}}>
        {/* Background grid */}
        <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none"/>
        {/* Ambient glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.12),transparent 70%)'}}/>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
        <div className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/"        element={<PageWrapper title="Dashboard"      subtitle="Netherlands rental overview"><Dashboard/></PageWrapper>}/>
            <Route path="/listings"element={<PageWrapper title="Listings"       subtitle="All scraped rental properties"><Listings/></PageWrapper>}/>
            <Route path="/queries" element={<PageWrapper title="Client queries" subtitle="People looking for rentals"><Queries/></PageWrapper>}/>
            <Route path="/matches" element={<PageWrapper title="Matches"        subtitle="AI-powered client matching"><Matches/></PageWrapper>}/>
            <Route path="/paste"   element={<PageWrapper title="Quick paste"    subtitle="Paste from Facebook · WhatsApp · Instagram"><QuickPaste/></PageWrapper>}/>
            <Route path="/scraper" element={<PageWrapper title="Scraper status" subtitle="Auto-scraping Dutch rental sites"><ScraperPage/></PageWrapper>}/>
            <Route path="/ai"      element={<PageWrapper title="AI settings"    subtitle="Provider · model · API key"><AISettings/></PageWrapper>}/>
          </Routes>
        </div>
        <Toaster position="top-right" toastOptions={{style:{background:'#1a1a2e',color:'#f1f5f9',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'12px',fontSize:'13px'}}}/>
      </div>
    </BrowserRouter>
  )
}
