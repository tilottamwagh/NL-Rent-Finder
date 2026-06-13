// Queries.jsx
import React, { useState, useEffect } from 'react'
import { Plus, User, Phone, MapPin, Euro, BedDouble, Calendar, Shuffle, Trash2, Sparkles } from 'lucide-react'
import { queriesAPI } from '../api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const CITIES = ['Amsterdam','Rotterdam','Utrecht','Den Haag','Eindhoven','Groningen','Haarlem','Leiden','Any']

function QueryCard({ q, onDelete, onMatch }) {
  const initials = q.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  const colors = ['#6366f1','#2dd4bf','#fbbf24','#34d399','#fb7185','#818cf8']
  const color = colors[q.name.charCodeAt(0) % colors.length]
  return (
    <div className="glass-card p-4 flex items-start gap-4 hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{background:`${color}20`,color,border:`1px solid ${color}30`}}>{initials}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{q.name}</span>
          {q.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10}/>{q.phone}</span>}
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {q.preferred_city && <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10}/>{q.preferred_city}</span>}
          {q.max_budget    && <span className="text-xs text-slate-400 flex items-center gap-1"><Euro size={10}/>max €{q.max_budget}/mo</span>}
          {q.min_rooms     && <span className="text-xs text-slate-400 flex items-center gap-1"><BedDouble size={10}/>{q.min_rooms}+ rooms</span>}
          {q.move_in_date  && <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/>{q.move_in_date}</span>}
        </div>
        {q.notes && <div className="text-xs text-slate-600 mt-1 italic truncate">{q.notes}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onMatch(q.id)} className="btn-primary text-xs py-1.5 px-3"><Shuffle size={12}/>Match</button>
        <button onClick={() => onDelete(q.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={14}/></button>
      </div>
    </div>
  )
}

function AddQueryModal({ onClose, onSave }) {
  const [form, setForm] = useState({ preferred_city:'Amsterdam', min_rooms:1 })
  const [rawText, setRawText] = useState('')
  const [mode, setMode] = useState('form')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const save = async () => {
    const data = mode === 'ai' ? { ...form, name: form.name||'Client', raw_query_text: rawText } : form
    if (!data.name) return toast.error('Name is required')
    try { await queriesAPI.create(data); onSave(); onClose(); toast.success('Client added!') }
    catch(e) { toast.error('Error saving') }
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
        <div className="text-sm font-semibold text-white mb-4">Add client query</div>
        <div className="flex gap-2 mb-4">
          {['form','ai'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${mode===m?'bg-brand-500 text-white':'btn-ghost'}`}>
              {m==='ai' ? '✨ AI parse text' : '📝 Manual form'}
            </button>
          ))}
        </div>
        {mode === 'ai' && (
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1 block">Paste client's message (Dutch or English)</label>
            <textarea className="input-field resize-none" rows={3} placeholder="e.g. need flat near rotterdam, me and girlfriend, max 1200, asap"
              value={rawText} onChange={e=>setRawText(e.target.value)}/>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1"><Sparkles size={10} className="text-brand-400"/>AI will auto-fill city, budget, rooms from the text</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs text-slate-500 mb-1 block">Client name *</label>
            <input className="input-field" placeholder="Full name" value={form.name||''} onChange={e=>set('name',e.target.value)}/></div>
          <div><label className="text-xs text-slate-500 mb-1 block">Phone / WhatsApp</label>
            <input className="input-field" placeholder="+31…" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/></div>
          <div><label className="text-xs text-slate-500 mb-1 block">City</label>
            <select className="input-field" value={form.preferred_city||'Amsterdam'} onChange={e=>set('preferred_city',e.target.value)}>
              {CITIES.map(c=><option key={c}>{c}</option>)}
            </select></div>
          <div><label className="text-xs text-slate-500 mb-1 block">Max budget (€/mo)</label>
            <input className="input-field" type="number" placeholder="1500" value={form.max_budget||''} onChange={e=>set('max_budget',parseFloat(e.target.value))}/></div>
          <div><label className="text-xs text-slate-500 mb-1 block">Min rooms</label>
            <input className="input-field" type="number" placeholder="2" value={form.min_rooms||1} onChange={e=>set('min_rooms',parseInt(e.target.value))}/></div>
          <div><label className="text-xs text-slate-500 mb-1 block">Move-in date</label>
            <input className="input-field" type="date" value={form.move_in_date||''} onChange={e=>set('move_in_date',e.target.value)}/></div>
          <div><label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <input className="input-field" placeholder="Any special needs…" value={form.notes||''} onChange={e=>set('notes',e.target.value)}/></div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}><Plus size={14}/>Save client</button>
        </div>
      </div>
    </div>
  )
}

export function Queries() {
  const [queries, setQueries] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const nav = useNavigate()
  const load = () => queriesAPI.getAll().then(r => setQueries(r.data||[]))
  useEffect(() => { load() }, [])
  const handleDelete = async (id) => { await queriesAPI.delete(id); toast.success('Query removed'); load() }
  const handleMatch = (id) => nav(`/matches?query=${id}`)
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-xs text-slate-500"><span className="text-white font-medium">{queries.length}</span> active clients</div>
        <button className="btn-primary" onClick={()=>setShowAdd(true)}><Plus size={15}/>Add client</button>
      </div>
      {queries.length === 0
        ? <div className="glass-card p-16 text-center"><User size={40} className="mx-auto text-slate-600 mb-3"/><div className="text-slate-400">No clients yet</div></div>
        : queries.map(q => <QueryCard key={q.id} q={q} onDelete={handleDelete} onMatch={handleMatch}/>)}
      {showAdd && <AddQueryModal onClose={()=>setShowAdd(false)} onSave={load}/>}
    </div>
  )
}
export default Queries
