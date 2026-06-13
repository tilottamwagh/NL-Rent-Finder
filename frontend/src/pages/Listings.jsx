import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, MapPin, BedDouble, Ruler, Calendar, Phone, Share2, Trash2, ExternalLink, Euro, Star } from 'lucide-react'
import { listingsAPI } from '../api'
import toast from 'react-hot-toast'

const CITIES = ['Amsterdam','Rotterdam','Utrecht','Den Haag','Eindhoven','Groningen','Haarlem','Leiden','Delft']
const TYPES  = ['Apartment','House','Studio','Flat','Room']
const SOURCES = ['Marktplaats','Pararius','Kamernet','HousingAnywhere','Telegram','Manual']
const SRC_COLOR = { Marktplaats:'#6366f1',Pararius:'#2dd4bf',Kamernet:'#fbbf24',HousingAnywhere:'#34d399',Telegram:'#818cf8',Manual:'#94a3b8',Facebook:'#3b5998',Instagram:'#e1306c' }

function QualityDot({ score }) {
  const color = score >= 7 ? '#34d399' : score >= 4 ? '#fbbf24' : '#fb7185'
  return <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:color,boxShadow:`0 0 4px ${color}`}}/>
}

function ListingCard({ listing, onDelete, onShare }) {
  const srcColor = SRC_COLOR[listing.source] || '#6366f1'
  const shareMsg = `🏠 ${listing.property_type||'Property'} — ${listing.neighborhood||''}, ${listing.city}\n💶 €${listing.rent_price||'?'}/mo | ${listing.rooms||'?'} rooms | ${listing.size_m2||'?'}m²\n📅 Available: ${listing.available_from||'TBD'}\n📞 ${listing.contact_info||'See listing'}\n🔗 ${listing.source_url||''}`
  return (
    <div className="glass-card overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Header band */}
      <div className="h-2 w-full" style={{background:`linear-gradient(90deg,${srcColor},${srcColor}80)`}}/>
      <div className="p-4 flex-1 flex flex-col">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <QualityDot score={listing.quality_score||5}/>
              <span className="text-xs font-medium text-slate-300">{listing.property_type||'Property'}</span>
            </div>
            <div className="text-sm font-semibold text-white leading-tight">
              {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}
            </div>
          </div>
          <span className="badge flex-shrink-0 text-[10px] px-2 py-1" style={{background:`${srcColor}20`,color:srcColor,border:`1px solid ${srcColor}30`}}>
            {listing.source}
          </span>
        </div>
        {/* Price */}
        <div className="text-xl font-bold mb-3" style={{background:'linear-gradient(135deg,#f1f5f9,#94a3b8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          {listing.rent_price ? `€${listing.rent_price.toLocaleString()}/mo` : 'Price TBD'}
        </div>
        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
          {listing.rooms && <span className="flex items-center gap-1"><BedDouble size={11}/>{listing.rooms} rooms</span>}
          {listing.size_m2 && <span className="flex items-center gap-1"><Ruler size={11}/>{listing.size_m2}m²</span>}
          {listing.available_from && <span className="flex items-center gap-1"><Calendar size={11}/>{listing.available_from}</span>}
          {listing.furnished && <span className="badge badge-teal text-[10px] px-1.5 py-0.5">Furnished</span>}
        </div>
        {/* Quality score */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="h-full rounded-full" style={{width:`${(listing.quality_score||5)*10}%`,background:'linear-gradient(90deg,#6366f1,#2dd4bf)'}}/>
          </div>
          <span className="text-xs text-slate-600">Q{listing.quality_score?.toFixed(1)||'5.0'}</span>
        </div>
        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {listing.contact_info && (
            <button onClick={() => { navigator.clipboard.writeText(listing.contact_info); toast.success('Contact copied!') }}
              className="btn-ghost flex-1 text-xs justify-center py-1.5">
              <Phone size={13}/>Contact
            </button>
          )}
          <button onClick={() => { navigator.clipboard.writeText(shareMsg); toast.success('Message copied!') }}
            className="btn-primary flex-1 text-xs justify-center py-1.5">
            <Share2 size={13}/>Share
          </button>
          {listing.source_url && (
            <a href={listing.source_url} target="_blank" rel="noopener" className="btn-ghost px-2.5 py-1.5">
              <ExternalLink size={13}/>
            </a>
          )}
          <button onClick={() => onDelete(listing.id)} className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </div>
  )
}

function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState({ property_type:'Apartment', city:'Amsterdam', source:'Manual' })
  const set = (k,v) => setForm(f => ({...f,[k]:v}))
  const save = async () => {
    if (!form.city) return toast.error('City is required')
    try { await listingsAPI.create(form); onSave(); onClose(); toast.success('Listing saved!') }
    catch(e) { toast.error(e.response?.data?.detail || 'Error saving') }
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="text-sm font-semibold text-white mb-4">Add listing manually</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-slate-500 mb-1 block">Type</label>
            <select className="input-field" value={form.property_type} onChange={e => set('property_type',e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">City *</label>
            <select className="input-field" value={form.city} onChange={e => set('city',e.target.value)}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Neighborhood</label>
            <input className="input-field" placeholder="e.g. Jordaan" value={form.neighborhood||''} onChange={e => set('neighborhood',e.target.value)}/>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Rent (€/mo)</label>
            <input className="input-field" type="number" placeholder="1400" value={form.rent_price||''} onChange={e => set('rent_price',parseFloat(e.target.value))}/>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Rooms</label>
            <input className="input-field" type="number" placeholder="2" value={form.rooms||''} onChange={e => set('rooms',parseInt(e.target.value))}/>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Size (m²)</label>
            <input className="input-field" type="number" placeholder="70" value={form.size_m2||''} onChange={e => set('size_m2',parseFloat(e.target.value))}/>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Available from</label>
            <input className="input-field" type="date" value={form.available_from||''} onChange={e => set('available_from',e.target.value)}/>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Source</label>
            <select className="input-field" value={form.source} onChange={e => set('source',e.target.value)}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="text-xs text-slate-500 mb-1 block">Contact info</label>
            <input className="input-field" placeholder="+31 6 12345678 or email" value={form.contact_info||''} onChange={e => set('contact_info',e.target.value)}/>
          </div>
          <div className="col-span-2"><label className="text-xs text-slate-500 mb-1 block">Source URL</label>
            <input className="input-field" placeholder="https://…" value={form.source_url||''} onChange={e => set('source_url',e.target.value)}/>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save listing</button>
        </div>
      </div>
    </div>
  )
}

export default function Listings() {
  const [listings, setListings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [source, setSource] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    listingsAPI.getAll({ city: city||undefined, property_type: type||undefined, source: source||undefined, limit:50 })
      .then(r => { setListings(r.data.items||[]); setTotal(r.data.total||0) })
      .finally(() => setLoading(false))
  }, [city, type, source])

  useEffect(() => { load() }, [load])

  const filtered = listings.filter(l =>
    !search || l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
    l.property_type?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id) => {
    await listingsAPI.delete(id)
    toast.success('Listing removed')
    load()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input className="input-field pl-9" placeholder="Search city, area…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="input-field w-auto" value={city} onChange={e => setCity(e.target.value)}>
          <option value="">All cities</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input-field w-auto" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input-field w-auto" value={source} onChange={e => setSource(e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15}/>Add listing</button>
      </div>

      {/* Count */}
      <div className="text-xs text-slate-500">
        Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of <span className="text-slate-300 font-medium">{total}</span> listings
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_,i) => <div key={i} className="glass-card h-56 shimmer"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Building2 size={40} className="mx-auto text-slate-600 mb-3"/>
          <div className="text-slate-400 font-medium">No listings found</div>
          <div className="text-slate-600 text-sm mt-1">Try adjusting your filters or run the scraper</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => <ListingCard key={l.id} listing={l} onDelete={handleDelete}/>)}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={load}/>}
    </div>
  )
}
