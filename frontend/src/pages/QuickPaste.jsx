import React, { useState } from 'react'
import { ClipboardPaste, Sparkles, Check, MapPin, Euro, BedDouble, Ruler, Calendar, Phone, Save, X } from 'lucide-react'
import { listingsAPI } from '../api'
import toast from 'react-hot-toast'

const CHIP_ICONS = { city: MapPin, rent_price: Euro, rooms: BedDouble, size_m2: Ruler, available_from: Calendar, contact_info: Phone }
const CHIP_LABELS = { city:'City', rent_price:'Price', rooms:'Rooms', size_m2:'Size', available_from:'Available', contact_info:'Contact', property_type:'Type', neighborhood:'Area', furnished:'Furnished' }

export default function QuickPaste() {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const EXAMPLES = [
    "Te huur: mooi appartement Amsterdam centrum, 2 slaapkamers, 70m2, €1.400 per maand exclusief. Beschikbaar per 1 juli. Bel of app: +31 6 12345678",
    "Studio available in Rotterdam, 35m2, €850/mo, furnished, available immediately. WhatsApp: +31698765432",
    "House for rent Den Haag, 4 bedrooms, 120m2, garden, €2200/month, July 15. Contact: landlord@email.nl"
  ]

  const handleParse = async () => {
    if (!text.trim()) return toast.error('Paste some text first')
    setLoading(true); setParsed(null); setSaved(false)
    try {
      const r = await listingsAPI.parse(text)
      setParsed({ ...r, source: 'Facebook', raw_text: text })
      toast.success('AI parsed the listing!')
    } catch(e) { toast.error('Parse failed') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!parsed) return
    try {
      await listingsAPI.create({ ...parsed, city: parsed.city || 'Netherlands' })
      setSaved(true); toast.success('Listing saved to database!')
    } catch(e) { toast.error(e.response?.data?.detail || 'Error saving') }
  }

  const chips = parsed ? Object.entries(parsed)
    .filter(([k,v]) => CHIP_LABELS[k] && v && k !== 'raw_text' && k !== 'source')
    .map(([k,v]) => ({ key: k, label: CHIP_LABELS[k], value: k === 'rent_price' ? `€${v}/mo` : k === 'size_m2' ? `${v}m²` : k === 'rooms' ? `${v} rooms` : k === 'furnished' ? (v ? 'Furnished' : null) : String(v) }))
    .filter(c => c.value && c.value !== 'null' && c.value !== 'false') : []

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Hero */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48" style={{background:'radial-gradient(ellipse at 100% 0%,rgba(99,102,241,0.12),transparent)'}}/>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardPaste size={18} className="text-brand-400"/>
          <span className="text-sm font-semibold text-white">Quick paste — AI listing parser</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Copy any rental listing from Facebook, WhatsApp, Instagram or anywhere. Paste it below.
          AI reads Dutch and English text and extracts all details automatically.
        </p>
      </div>

      {/* Paste area */}
      <div className="glass-card p-5">
        <label className="text-xs text-slate-500 mb-2 block">Paste listing text here</label>
        <textarea
          className="input-field resize-none w-full mb-3 leading-relaxed"
          rows={6}
          placeholder="Paste text from Facebook, WhatsApp, Instagram…"
          value={text}
          onChange={e => { setText(e.target.value); setParsed(null); setSaved(false) }}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn-primary" onClick={handleParse} disabled={loading || !text.trim()}>
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Parsing…</>
              : <><Sparkles size={14}/>Parse with AI</>}
          </button>
          {text && <button className="btn-ghost" onClick={() => { setText(''); setParsed(null) }}><X size={14}/>Clear</button>}
        </div>

        {/* Example buttons */}
        <div className="mt-4 pt-4 border-t" style={{borderColor:'rgba(99,102,241,0.1)'}}>
          <div className="text-xs text-slate-600 mb-2">Try an example:</div>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => { setText(ex); setParsed(null) }}
                className="text-left text-xs text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg transition-all hover:bg-white/5 truncate border border-transparent hover:border-white/10">
                {ex.slice(0, 80)}…
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parsed results */}
      {parsed && (
        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Check size={16} className="text-emerald-400"/>
            <span className="text-sm font-semibold text-white">AI extracted these details</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {chips.map(c => {
              const Icon = CHIP_ICONS[c.key]
              return (
                <div key={c.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)',color:'#a5b4fc'}}>
                  {Icon && <Icon size={11}/>}
                  <span className="text-slate-400">{c.label}:</span>
                  <span className="text-white">{c.value}</span>
                </div>
              )
            })}
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['city','neighborhood','rent_price','rooms','size_m2','available_from','contact_info'].map(k => (
              <div key={k}>
                <label className="text-xs text-slate-500 mb-1 block capitalize">{CHIP_LABELS[k]||k}</label>
                <input className="input-field text-xs" value={parsed[k]||''} onChange={e => setParsed(p => ({...p,[k]:e.target.value}))}/>
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Source</label>
              <select className="input-field text-xs" value={parsed.source||'Facebook'} onChange={e => setParsed(p=>({...p,source:e.target.value}))}>
                {['Facebook','WhatsApp','Instagram','Telegram','Manual'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={saved} className={`btn-primary w-full justify-center ${saved?'bg-emerald-600 border-emerald-600':''}`}>
            {saved ? <><Check size={14}/>Saved to database!</> : <><Save size={14}/>Save listing</>}
          </button>
        </div>
      )}
    </div>
  )
}
