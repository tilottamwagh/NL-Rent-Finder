// Matches.jsx
import React, { useState, useEffect } from 'react'
import { Shuffle, Copy, Check, MapPin, Euro, BedDouble, Ruler, Calendar, Sparkles, ChevronDown } from 'lucide-react'
import { queriesAPI, matchesAPI } from '../api'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

function ScoreRing({ score }) {
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#fb7185'
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold relative"
      style={{background:`conic-gradient(${color} ${score}%, rgba(255,255,255,0.05) 0%)`,padding:'3px'}}>
      <div className="w-full h-full rounded-full flex items-center justify-center" style={{background:'#1a1a2e'}}>
        <span style={{color}}>{Math.round(score)}%</span>
      </div>
    </div>
  )
}

export function Matches() {
  const [queries, setQueries] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [params] = useSearchParams()

  useEffect(() => {
    queriesAPI.getAll().then(r => {
      setQueries(r.data||[])
      const qp = params.get('query')
      if (qp) { setSelectedId(qp); runMatch(qp) }
    })
  }, [])

  const runMatch = async (id) => {
    const qid = id || selectedId
    if (!qid) return
    setLoading(true); setMatches([])
    try { const r = await matchesAPI.getForQuery(qid); setMatches(r.data||[]) }
    catch(e) { toast.error('Match failed') }
    finally { setLoading(false) }
  }

  const client = queries.find(q => q.id === selectedId)
  const shareAll = matches.slice(0,3).map((m,i) =>
    `${i+1}. ${m.listing?.property_type||'Property'} — ${m.listing?.neighborhood||''}, ${m.listing?.city}\n   💶 €${m.listing?.rent_price||'?'}/mo | ${m.listing?.rooms||'?'} rooms | ${m.listing?.size_m2||'?'}m²\n   📅 ${m.listing?.available_from||'TBD'}\n   📞 ${m.listing?.contact_info||''}`
  ).join('\n\n')
  const fullMsg = matches[0]?.message || `🏠 Rental matches found for you!\n\n${shareAll}\n\n---\n💰 Service fee: €50\n📲 PayPal QR attached`

  const copyMsg = () => {
    navigator.clipboard.writeText(fullMsg)
    setCopied(true); toast.success('Message copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Client selector */}
      <div className="glass-card p-5">
        <div className="text-sm font-semibold text-white mb-3">Find matches for a client</div>
        <div className="flex gap-3">
          <select className="input-field flex-1" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">Select a client…</option>
            {queries.map(q => <option key={q.id} value={q.id}>{q.name} — {q.preferred_city} max €{q.max_budget}</option>)}
          </select>
          <button className="btn-primary" onClick={() => runMatch()} disabled={!selectedId||loading}>
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Shuffle size={15}/>Find matches</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {matches.length > 0 && (
        <>
          <div className="grid gap-4">
            {matches.map((m,i) => (
              <div key={m.id} className="glass-card p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-all">
                <ScoreRing score={m.score}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white">{m.listing?.property_type} — {m.listing?.neighborhood ? `${m.listing.neighborhood}, ` : ''}{m.listing?.city}</span>
                    {i === 0 && <span className="badge badge-green">Best match</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    {m.listing?.rent_price && <span className="flex items-center gap-1"><Euro size={10}/>€{m.listing.rent_price}/mo</span>}
                    {m.listing?.rooms && <span className="flex items-center gap-1"><BedDouble size={10}/>{m.listing.rooms} rooms</span>}
                    {m.listing?.size_m2 && <span className="flex items-center gap-1"><Ruler size={10}/>{m.listing.size_m2}m²</span>}
                    {m.listing?.available_from && <span className="flex items-center gap-1"><Calendar size={10}/>{m.listing.available_from}</span>}
                  </div>
                  {m.listing?.contact_info && <div className="text-xs text-slate-500 mt-1">📞 {m.listing.contact_info}</div>}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(`🏠 ${m.listing?.property_type} in ${m.listing?.city}\n€${m.listing?.rent_price}/mo | ${m.listing?.rooms} rooms\n📞 ${m.listing?.contact_info||''}`); toast.success('Copied!') }}
                  className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0"><Copy size={12}/>Share</button>
              </div>
            ))}
          </div>

          {/* AI-generated message */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-brand-400"/>
                <span className="text-sm font-semibold text-white">AI-generated message</span>
                <span className="badge badge-purple text-[10px]">Ready to send</span>
              </div>
              <button onClick={copyMsg} className={`btn-primary text-xs py-1.5 ${copied?'bg-emerald-600':''}`}>
                {copied ? <><Check size={13}/>Copied!</> : <><Copy size={13}/>Copy message</>}
              </button>
            </div>
            <div className="p-4 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono"
              style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(99,102,241,0.1)'}}>
              {fullMsg}
            </div>
          </div>
        </>
      )}

      {!loading && matches.length === 0 && selectedId && (
        <div className="glass-card p-16 text-center">
          <Shuffle size={40} className="mx-auto text-slate-600 mb-3"/>
          <div className="text-slate-400">No strong matches found yet</div>
          <div className="text-slate-600 text-sm mt-1">Try running the scraper to get fresh listings</div>
        </div>
      )}
    </div>
  )
}
export default Matches
