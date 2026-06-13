// Scraper.jsx
import React, { useState, useEffect } from 'react'
import { Bot, Play, RefreshCw, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import { scraperAPI } from '../api'
import toast from 'react-hot-toast'

const SOURCES = [
  { name:'Marktplaats.nl',   url:'marktplaats.nl/huurwoningen',  active:true  },
  { name:'Pararius.nl',      url:'pararius.nl/huurwoningen',     active:true  },
  { name:'Kamernet.nl',      url:'kamernet.nl',                  active:true  },
  { name:'HousingAnywhere',  url:'housinganywhere.com',          active:true  },
  { name:'Funda.nl',         url:'funda.nl/huur',                active:false },
  { name:'Telegram channels',url:'NL Housing groups',            active:true  },
]

export function Scraper() {
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [sources, setSources] = useState(SOURCES)
  const load = () => scraperAPI.getLogs().then(r => setLogs(r.data||[])).catch(()=>{})
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [])

  const runNow = async () => {
    setRunning(true)
    try { await scraperAPI.runNow(); toast.success('Scraper started!'); setTimeout(load, 3000) }
    catch(e) { toast.error('Failed to start scraper') }
    finally { setTimeout(() => setRunning(false), 3000) }
  }

  const toggle = (i) => setSources(s => s.map((src,idx) => idx===i ? {...src,active:!src.active} : src))

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Sources */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Active sources</div>
          <button className="btn-primary" onClick={runNow} disabled={running}>
            {running ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Running…</> : <><Play size={14}/>Scrape now</>}
          </button>
        </div>
        <div className="space-y-2">
          {sources.map((src, i) => (
            <div key={src.name} className="flex items-center gap-4 p-3 rounded-xl transition-all" style={{background:'rgba(99,102,241,0.04)',border:'1px solid rgba(99,102,241,0.08)'}}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${src.active?'bg-emerald-400':'bg-slate-600'}`}
                style={src.active?{boxShadow:'0 0 6px #34d399'}:{}}/>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200">{src.name}</div>
                <div className="text-xs text-slate-500">{src.url}</div>
              </div>
              <span className={`badge ${src.active?'badge-green':'badge-amber'}`}>{src.active?'Active':'Paused'}</span>
              <button onClick={() => toggle(i)} className={`w-10 h-5 rounded-full relative transition-all duration-200 ${src.active?'bg-brand-500':'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${src.active?'left-5':'left-0.5'}`}/>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex gap-4" style={{borderColor:'rgba(99,102,241,0.1)'}}>
          <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer">
            <input type="radio" name="schedule" defaultChecked className="accent-brand-500"/>Every 2 hours
          </label>
          <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer">
            <input type="radio" name="schedule" className="accent-brand-500"/>Every 6 hours
          </label>
          <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer">
            <input type="radio" name="schedule" className="accent-brand-500"/>Once a day
          </label>
        </div>
      </div>

      {/* Logs */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Scraper logs</div>
          <button className="btn-ghost text-xs" onClick={load}><RefreshCw size={12}/>Refresh</button>
        </div>
        {logs.length === 0
          ? <div className="text-center py-8 text-slate-500 text-sm">No logs yet — run the scraper to see results</div>
          : <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl text-xs" style={{background:'rgba(0,0,0,0.2)'}}>
                  {log.status === 'success' ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0"/>
                    : log.status === 'error' ? <XCircle size={14} className="text-rose-400 flex-shrink-0"/>
                    : <div className="w-3.5 h-3.5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin flex-shrink-0"/>}
                  <span className="font-medium text-slate-300 w-32">{log.source}</span>
                  <span className="text-slate-500">{log.listings_found||0} found · {log.listings_saved||0} saved</span>
                  <span className="ml-auto text-slate-600 flex items-center gap-1"><Clock size={10}/>{log.started_at?.slice(0,16)?.replace('T',' ')}</span>
                </div>
              ))}
            </div>}
      </div>
    </div>
  )
}
export default Scraper
