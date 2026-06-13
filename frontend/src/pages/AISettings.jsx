import React, { useState, useEffect } from 'react'
import { Sparkles, Check, AlertCircle, Eye, EyeOff, Save, Zap } from 'lucide-react'
import { aiAPI } from '../api'
import toast from 'react-hot-toast'

const PROVIDERS = [
  { id:'openai',    name:'OpenAI',    models:['gpt-4o-mini','gpt-4o','gpt-3.5-turbo'], badge:'badge-green', note:'You have this key' },
  { id:'anthropic', name:'Anthropic Claude', models:['claude-haiku-4-5-20251001','claude-sonnet-4-6','claude-opus-4-6'], badge:'badge-purple', note:'Best for Dutch text' },
  { id:'gemini',    name:'Google Gemini', models:['gemini-1.5-flash','gemini-1.5-pro'], badge:'badge-blue', note:'Free tier available' },
  { id:'groq',      name:'Groq',      models:['llama-3.1-8b-instant','llama-3.1-70b-versatile'], badge:'badge-amber', note:'Very fast, free tier' },
  { id:'ollama',    name:'Ollama (local)', models:['llama3','mistral','gemma2'], badge:'badge-teal', note:'Free, runs on your VPS' },
]

export default function AISettings() {
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    aiAPI.getSettings().then(r => {
      if (r.data.provider) setProvider(r.data.provider)
      if (r.data.model) setModel(r.data.model)
    }).catch(()=>{})
  }, [])

  const currentProvider = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0]

  const handleProviderChange = (pid) => {
    setProvider(pid)
    setModel(PROVIDERS.find(p=>p.id===pid)?.models[0] || '')
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!apiKey && provider !== 'ollama') return toast.error('Enter API key first')
    setTesting(true); setTestResult(null)
    try {
      const r = await aiAPI.test({ provider, model, api_key: apiKey })
      setTestResult(r.data)
      toast.success(r.data.success ? 'Connection successful!' : 'Connection failed')
    } catch(e) { setTestResult({ success: false, response: 'Request failed' }) }
    finally { setTesting(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await aiAPI.updateSettings({ provider, model, api_key: apiKey || undefined })
      toast.success('AI settings saved!')
    } catch(e) { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Current status */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)'}}>
          <Sparkles size={18} className="text-brand-400"/>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">AI provider configuration</div>
          <div className="text-xs text-slate-500 mt-0.5">Currently using <span className="text-brand-400 font-medium">{currentProvider.name}</span> · {model} · ~€0.60/mo estimated cost</div>
        </div>
        <div className="ml-auto"><span className={`badge ${currentProvider.badge}`}><Zap size={10}/>Active</span></div>
      </div>

      {/* Provider selection */}
      <div className="glass-card p-5">
        <div className="text-sm font-semibold text-white mb-4">Select AI provider</div>
        <div className="grid grid-cols-1 gap-2">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => handleProviderChange(p.id)}
              className={`flex items-center gap-4 p-3.5 rounded-xl text-left transition-all ${provider===p.id ? 'border-2 border-brand-500/50' : 'border border-white/5 hover:border-white/10'}`}
              style={provider===p.id ? {background:'rgba(99,102,241,0.1)'} : {background:'rgba(255,255,255,0.02)'}}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${provider===p.id ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400'}`}>
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{p.name}</div>
                <div className="text-xs text-slate-500">{p.note}</div>
              </div>
              <span className={`badge ${p.badge} flex-shrink-0 text-[10px]`}>{p.id==='openai'?'You have this':'Available'}</span>
              {provider===p.id && <Check size={16} className="text-brand-400 flex-shrink-0"/>}
            </button>
          ))}
        </div>
      </div>

      {/* Model + key */}
      <div className="glass-card p-5 space-y-4">
        <div>
          <label className="text-xs text-slate-500 mb-2 block">Model</label>
          <select className="input-field" value={model} onChange={e => setModel(e.target.value)}>
            {currentProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {provider !== 'ollama' && (
          <div>
            <label className="text-xs text-slate-500 mb-2 block">API key</label>
            <div className="relative">
              <input className="input-field pr-10" type={showKey?'text':'password'}
                placeholder={`${currentProvider.name} API key…`}
                value={apiKey} onChange={e => setApiKey(e.target.value)}/>
              <button onClick={() => setShowKey(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showKey ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            <div className="text-xs text-slate-600 mt-1">Set here for testing. For production, use Coolify env vars.</div>
          </div>
        )}
        {provider === 'ollama' && (
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Ollama URL</label>
            <input className="input-field" placeholder="http://localhost:11434" defaultValue="http://localhost:11434"/>
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
            {testResult.success ? <Check size={14}/> : <AlertCircle size={14}/>}
            {testResult.success ? `Connected! Response: "${testResult.response}"` : `Failed: ${testResult.response}`}
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={handleTest} disabled={testing}>
            {testing ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>Testing…</> : <>Test connection</>}
          </button>
          <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : <><Save size={14}/>Save settings</>}
          </button>
        </div>
      </div>

      {/* Cost estimate */}
      <div className="glass-card p-5">
        <div className="text-sm font-semibold text-white mb-3">Estimated monthly AI cost</div>
        <div className="space-y-2">
          {[['Quick Paste parsing (10/day)','~€0.07'],['Telegram classifier (50 msgs/day)','~€0.35'],['Match message writer (5/day)','~€0.14'],['Query understander (5/day)','~€0.04']].map(([label, cost]) => (
            <div key={label} className="flex justify-between text-xs py-1.5 border-b last:border-0" style={{borderColor:'rgba(99,102,241,0.08)'}}>
              <span className="text-slate-400">{label}</span>
              <span className="text-slate-300 font-medium">{cost}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 font-semibold">
            <span className="text-slate-300">Total</span>
            <span style={{background:'linear-gradient(135deg,#6366f1,#2dd4bf)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>~€0.60/mo</span>
          </div>
        </div>
      </div>
    </div>
  )
}
