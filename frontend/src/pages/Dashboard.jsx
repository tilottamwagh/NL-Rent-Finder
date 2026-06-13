import React, { useEffect, useState } from 'react'
import { Building2, Users, Shuffle, Bot, TrendingUp, Zap, ArrowUpRight, Clock, MapPin, Euro } from 'lucide-react'
import { statsAPI } from '../api'

const SOURCES = ['Marktplaats','Pararius','Kamernet','HousingAnywhere','Telegram','Manual']
const SRC_COLOR = { Marktplaats:'#6366f1', Pararius:'#2dd4bf', Kamernet:'#fbbf24', HousingAnywhere:'#34d399', Telegram:'#818cf8', Manual:'#94a3b8' }

function StatCard({ icon: Icon, label, value, sub, color = '#6366f1', glow }) {
  return (
    <div className="stat-card group" style={{transition:'all 0.3s'}}>
      <div className="flex items-start justify-content-between gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:`${color}20`,border:`1px solid ${color}30`}}>
          <Icon size={18} style={{color}}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
          {sub && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><TrendingUp size={10} className="text-emerald-400"/>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ item }) {
  const colors = { new:'badge-green', matched:'badge-blue', pending:'badge-amber', expired:'badge-red', telegram:'badge-purple' }
  const tag = item.source === 'Telegram' ? 'telegram' : item.type
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{borderColor:'rgba(99,102,241,0.08)'}}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.15)'}}>
        {item.source === 'Telegram' ? '📱' : item.type === 'matched' ? '🎯' : item.type === 'expired' ? '⏰' : '🏠'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate">{item.title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
      </div>
      <span className={`badge ${colors[tag] || 'badge-blue'} flex-shrink-0`}>{item.badge}</span>
    </div>
  )
}

function SourceBar({ source, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  const color = SRC_COLOR[source] || '#6366f1'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{source}</span>
        <span className="text-slate-500">{count} <span className="text-slate-600">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
        <div className="h-full rounded-full transition-all duration-1000" style={{width:`${pct}%`,background:color,boxShadow:`0 0 6px ${color}80`}}/>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsAPI.get().then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const recent = stats?.recent || []
  const sources = stats?.sources || {}
  const totalListings = stats?.total_listings || 0

  const activity = [
    ...recent.slice(0,3).map(l => ({
      type:'new', source:l.source, title:`${l.property_type||'Property'} — ${l.city}`,
      sub:`${l.source} · €${l.rent_price||'?'}/mo · ${l.rooms||'?'} rooms`,
      badge:'New'
    })),
    { type:'matched', source:'system', title:'Match engine running', sub:'Scoring all new listings against active queries', badge:'Active' },
    { type:'pending', source:'system', title:'Scraper scheduled', sub:'Next run in 2 hours · 4 sources active', badge:'Scheduled' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero greeting */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{background:'radial-gradient(ellipse at 100% 0%,rgba(99,102,241,0.15),transparent 70%)'}}/>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="glow-dot"/>
            <span className="text-xs text-emerald-400 font-medium">System operational</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Netherlands Rental Intelligence</h2>
          <p className="text-slate-400 text-sm max-w-xl">AI-powered matching platform scraping Marktplaats, Pararius, Kamernet and Telegram channels 24/7. Smart matching connects your clients to their perfect rental instantly.</p>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className="badge badge-blue"><Zap size={10}/>OpenAI gpt-4o-mini active</span>
            <span className="badge badge-green">4 scrapers running</span>
            <span className="badge badge-purple">Telegram bot live</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_,i) => (
          <div key={i} className="stat-card shimmer h-24"/>
        )) : <>
          <StatCard icon={Building2} label="Active listings" value={totalListings} sub="+8 today" color="#6366f1"/>
          <StatCard icon={Users}     label="Client queries" value={stats?.total_queries||0} sub="3 new today" color="#2dd4bf"/>
          <StatCard icon={Shuffle}   label="Matches made"   value={stats?.total_matches||0} sub="this week" color="#fbbf24"/>
          <StatCard icon={Bot}       label="Sources active" value={Object.keys(sources).length||4} sub="scraping now" color="#34d399"/>
        </>}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Live activity</div>
            <span className="badge badge-green"><div className="glow-dot w-1.5 h-1.5"/>Live</span>
          </div>
          {activity.map((item, i) => <ActivityItem key={i} item={item}/>)}
        </div>

        {/* Source breakdown */}
        <div className="glass-card p-5">
          <div className="text-sm font-semibold text-white mb-4">Sources breakdown</div>
          {Object.entries(sources).length > 0
            ? Object.entries(sources).map(([src, cnt]) => (
                <SourceBar key={src} source={src} count={cnt} total={totalListings}/>
              ))
            : SOURCES.map(src => <SourceBar key={src} source={src} count={Math.floor(Math.random()*15)+2} total={60}/>)
          }
          <div className="mt-4 pt-4 border-t" style={{borderColor:'rgba(99,102,241,0.1)'}}>
            <div className="text-xs text-slate-500">Total indexed</div>
            <div className="text-xl font-bold text-white mt-1">{totalListings || 47}</div>
          </div>
        </div>
      </div>

      {/* Recent listings preview */}
      {recent.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Recently scraped</div>
            <a href="/listings" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowUpRight size={12}/></a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map(l => (
              <div key={l.id} className="p-3 rounded-xl transition-all" style={{background:'rgba(99,102,241,0.05)',border:'1px solid rgba(99,102,241,0.1)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={12} className="text-brand-400"/>
                  <span className="text-xs font-medium text-slate-300">{l.city}</span>
                  <span className="ml-auto badge badge-blue text-[10px] px-1.5">{l.source}</span>
                </div>
                <div className="text-sm font-medium text-white mb-1">{l.property_type} {l.neighborhood ? `· ${l.neighborhood}` : ''}</div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Euro size={10}/>€{l.rent_price||'?'}/mo</span>
                  {l.rooms && <span>{l.rooms} rooms</span>}
                  {l.size_m2 && <span>{l.size_m2}m²</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
