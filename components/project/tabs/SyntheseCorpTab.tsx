'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Save, Download, ChevronDown, ChevronUp, Upload, X, FileText,
  Loader2, CheckCircle, AlertCircle, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SyntheseData {
  // Section 1 – Contexte client
  client_maitre_ouvrage:   string
  nom_projet_synthese:     string
  typologie_client:        '' | 'C1' | 'C2' | 'C3'
  opportunite_crm:         string
  besoin_description:      string
  marche_description:      string
  marche_objet:            string
  besoin_client:           string
  materiel_installer:      string
  // Section 2 – Contexte commercial
  type_ao:                 string
  montant_projet:          string
  duree_contrat:           string
  type_accord:             string[]
  mode_comparaison:        string[]
  environnement_offre:     string
  nature_prix:             string
  duree_validite:          string
  validite_type:           string[]
  negociation_prevue:      boolean
  visite_technique:        boolean
  critere_1:               string
  critere_2:               string
  critere_3:               string
  concurrence_identifiee:  string
  atouts:                  string
  faiblesses:              string
  strategie_reponse:       string
  type_reponse:            string[]
  supervision_sous_traitance: string
  // Section 3 – Planning
  planning_reception_dce:     string
  planning_comeco:             string
  planning_lancement_interne:  string
  planning_bouclage:           string
  planning_remise_offre:       string
  planning_projet:             string
  // Section 4 – Solution
  analyse_prestations:  string
  organisation_interne: string
  // Section 5 – Aspects contractuels
  aspects_contractuels: string
  // Section 6 – Chiffrage
  hypotheses_chiffrage: string
  feuille_vente:        string
  aleas:                string
  // Section 7 – Risques
  risques_operationnels: string
  risques_financiers:    string
  opportunites:          string
  // Section 8 – Décisions
  responsable_etude: string
  date_remise_etude: string
}

const EMPTY: SyntheseData = {
  client_maitre_ouvrage: '', nom_projet_synthese: '', typologie_client: '',
  opportunite_crm: '', besoin_description: '', marche_description: '',
  marche_objet: '', besoin_client: '', materiel_installer: '',
  type_ao: '', montant_projet: '', duree_contrat: '',
  type_accord: [], mode_comparaison: [], environnement_offre: '',
  nature_prix: '', duree_validite: '', validite_type: [],
  negociation_prevue: false, visite_technique: false,
  critere_1: '', critere_2: '', critere_3: '',
  concurrence_identifiee: '', atouts: '', faiblesses: '',
  strategie_reponse: '', type_reponse: [], supervision_sous_traitance: '',
  planning_reception_dce: '', planning_comeco: '', planning_lancement_interne: '',
  planning_bouclage: '', planning_remise_offre: '', planning_projet: '',
  analyse_prestations: '', organisation_interne: '',
  aspects_contractuels: '',
  hypotheses_chiffrage: '', feuille_vente: '', aleas: '',
  risques_operationnels: '', risques_financiers: '', opportunites: '',
  responsable_etude: '', date_remise_etude: '',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title, color, children, defaultOpen = true,
}: {
  title: string
  color: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-[#1a1d2e] border border-white/8 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors"
      >
        <div className={cn('w-1 h-5 rounded-full flex-shrink-0', color)} />
        <span className="text-sm font-semibold text-white flex-1 text-left">{title}</span>
        {open
          ? <ChevronUp size={15} className="text-white/30" />
          : <ChevronDown size={15} className="text-white/30" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Inp({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
    />
  )
}

function Txta({
  value, onChange, rows = 3, placeholder,
}: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all resize-y"
    />
  )
}

function CheckGroup({
  options, value, onChange,
}: {
  options: { id: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => toggle(o.id)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            value.includes(o.id)
              ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function RadioGroup({
  options, value, onChange,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            value === o.id
              ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function YesNo({
  value, onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            value === v
              ? v
                ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                : 'bg-red-600/30 border-red-500/50 text-red-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80',
          )}
        >
          {v ? '✓ Oui' : '✗ Non'}
        </button>
      ))}
    </div>
  )
}

// ─── Template panel ────────────────────────────────────────────────────────

function TemplatePanel() {
  const [templateName, setTemplateName] = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [msg, setMsg]                   = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings/synthese-template')
      .then(r => r.json())
      .then(d => setTemplateName(d.template_name ?? null))
      .catch(() => {})
  }, [])

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setMsg(null)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/settings/synthese-template', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTemplateName(json.template_name)
      setMsg({ ok: true, text: 'Template chargé avec succès' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erreur upload' })
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function remove() {
    if (!confirm('Revenir au template SOGETREL par défaut ?')) return
    await fetch('/api/settings/synthese-template', { method: 'DELETE' })
    setTemplateName(null)
    setMsg({ ok: true, text: 'Template supprimé — template SOGETREL par défaut actif' })
  }

  return (
    <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Building2 size={15} className="text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Template entreprise</h3>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">
        Par défaut, l'export utilise le template SOGETREL. Vous pouvez charger votre propre fichier <code className="text-violet-300">.docx</code> avec des <code className="text-violet-300">{'{placeholder}'}</code> pour l'adapter à votre entreprise.
      </p>

      {templateName ? (
        <div className="flex items-center gap-2 bg-violet-900/20 border border-violet-500/30 rounded-lg px-3 py-2">
          <FileText size={13} className="text-violet-400 flex-shrink-0" />
          <span className="text-xs text-violet-300 flex-1 truncate">{templateName}</span>
          <button onClick={remove} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-white/30 italic">Template par défaut : SOGETREL</p>
      )}

      <div>
        <input ref={fileRef} type="file" accept=".docx" onChange={upload} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-lg transition-all disabled:opacity-40"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? 'Chargement...' : 'Charger un template .docx'}
        </button>
      </div>

      {msg && (
        <div className={cn(
          'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
          msg.ok
            ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/40'
            : 'text-red-400 bg-red-950/30 border border-red-800/40',
        )}>
          {msg.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          {msg.text}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SyntheseCorpTab({ projectId }: { projectId: string }) {
  const [data, setData]       = useState<SyntheseData>(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Helper to update a single field
  function set<K extends keyof SyntheseData>(key: K, value: SyntheseData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  // Load existing synthese on mount
  useEffect(() => {
    fetch(`/api/projects/${projectId}/synthese`)
      .then(r => r.json())
      .then(({ synthese }) => {
        if (synthese) {
          // Convert boolean-stored-as-text from DB
          setData({
            ...EMPTY,
            ...synthese,
            negociation_prevue: Boolean(synthese.negociation_prevue),
            visite_technique:   Boolean(synthese.visite_technique),
            type_accord:        synthese.type_accord        ?? [],
            mode_comparaison:   synthese.mode_comparaison   ?? [],
            validite_type:      synthese.validite_type      ?? [],
            type_reponse:       synthese.type_reponse       ?? [],
          })
        }
      })
      .catch(() => {})
  }, [projectId])

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/synthese`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Erreur sauvegarde')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally { setSaving(false) }
  }

  async function handleExport() {
    setExporting(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/synthese/export`, { method: 'POST' })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Erreur export')
      }
      const blob = await res.blob()
      const cd   = res.headers.get('Content-Disposition') ?? ''
      const name = cd.match(/filename="([^"]+)"/)?.[1] ?? 'Synthese.docx'
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur export')
    } finally { setExporting(false) }
  }

  return (
    <div className="space-y-4 pb-24">

      {/* Template panel */}
      <TemplatePanel />

      {/* ── Section 1 – Contexte client ──────────────────────────────────── */}
      <SectionCard title="1 · Contexte client" color="bg-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Client / Maître d'ouvrage">
            <Inp value={data.client_maitre_ouvrage} onChange={v => set('client_maitre_ouvrage', v)} />
          </Field>
          <Field label="Nom du projet">
            <Inp value={data.nom_projet_synthese} onChange={v => set('nom_projet_synthese', v)} />
          </Field>
        </div>

        <Field label="Typologie client">
          <RadioGroup
            options={[
              { id: 'C1', label: 'C1' },
              { id: 'C2', label: 'C2' },
              { id: 'C3', label: 'C3' },
            ]}
            value={data.typologie_client}
            onChange={v => set('typologie_client', v as SyntheseData['typologie_client'])}
          />
        </Field>

        <Field label="Opportunité CRM">
          <Inp value={data.opportunite_crm} onChange={v => set('opportunite_crm', v)} />
        </Field>

        <Field label="Description du besoin">
          <Txta value={data.besoin_description} onChange={v => set('besoin_description', v)} rows={3} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Description du marché">
            <Txta value={data.marche_description} onChange={v => set('marche_description', v)} rows={2} />
          </Field>
          <Field label="Objet du marché">
            <Txta value={data.marche_objet} onChange={v => set('marche_objet', v)} rows={2} />
          </Field>
        </div>

        <Field label="Besoin client">
          <Txta value={data.besoin_client} onChange={v => set('besoin_client', v)} rows={2} />
        </Field>

        <Field label="Matériel à installer">
          <Txta value={data.materiel_installer} onChange={v => set('materiel_installer', v)} rows={2} />
        </Field>
      </SectionCard>

      {/* ── Section 2 – Contexte commercial ─────────────────────────────── */}
      <SectionCard title="2 · Contexte commercial" color="bg-violet-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Type d'appel d'offres">
            <Inp value={data.type_ao} onChange={v => set('type_ao', v)} />
          </Field>
          <Field label="Montant projet">
            <Inp value={data.montant_projet} onChange={v => set('montant_projet', v)} placeholder="ex: 500 000 €" />
          </Field>
          <Field label="Durée de contrat">
            <Inp value={data.duree_contrat} onChange={v => set('duree_contrat', v)} placeholder="ex: 3 ans" />
          </Field>
        </div>

        <Field label="Type d'accord">
          <CheckGroup
            options={[
              { id: 'forfait', label: 'Forfait' },
              { id: 'bpu',     label: 'BPU' },
              { id: 'bpf',     label: 'BPF' },
            ]}
            value={data.type_accord}
            onChange={v => set('type_accord', v)}
          />
        </Field>

        <Field label="Mode de comparaison">
          <CheckGroup
            options={[
              { id: 'dpgf',     label: 'DPGF' },
              { id: 'dqe_bpu',  label: 'DQE / BPU' },
              { id: 'liste_pu', label: 'Liste PU' },
              { id: 'devis',    label: 'Devis' },
            ]}
            value={data.mode_comparaison}
            onChange={v => set('mode_comparaison', v)}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Environnement de l'offre">
            <Inp value={data.environnement_offre} onChange={v => set('environnement_offre', v)} />
          </Field>
          <Field label="Nature des prix">
            <Inp value={data.nature_prix} onChange={v => set('nature_prix', v)} />
          </Field>
          <Field label="Durée de validité de l'offre">
            <Inp value={data.duree_validite} onChange={v => set('duree_validite', v)} placeholder="ex: 90 jours" />
          </Field>
        </div>

        <Field label="Type de validité">
          <CheckGroup
            options={[
              { id: 'ferme',       label: 'Ferme' },
              { id: 'actualisable',label: 'Actualisable' },
              { id: 'revisable',   label: 'Révisable' },
            ]}
            value={data.validite_type}
            onChange={v => set('validite_type', v)}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Négociation prévue">
            <YesNo value={data.negociation_prevue} onChange={v => set('negociation_prevue', v)} />
          </Field>
          <Field label="Visite technique">
            <YesNo value={data.visite_technique} onChange={v => set('visite_technique', v)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Critère 1"><Inp value={data.critere_1} onChange={v => set('critere_1', v)} /></Field>
          <Field label="Critère 2"><Inp value={data.critere_2} onChange={v => set('critere_2', v)} /></Field>
          <Field label="Critère 3"><Inp value={data.critere_3} onChange={v => set('critere_3', v)} /></Field>
        </div>

        <Field label="Concurrence identifiée">
          <Txta value={data.concurrence_identifiee} onChange={v => set('concurrence_identifiee', v)} rows={2} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Atouts">
            <Txta value={data.atouts} onChange={v => set('atouts', v)} rows={3} />
          </Field>
          <Field label="Faiblesses">
            <Txta value={data.faiblesses} onChange={v => set('faiblesses', v)} rows={3} />
          </Field>
        </div>

        <Field label="Stratégie de réponse">
          <Txta value={data.strategie_reponse} onChange={v => set('strategie_reponse', v)} rows={2} />
        </Field>

        <Field label="Type de réponse">
          <CheckGroup
            options={[
              { id: 'seul',           label: 'Seul' },
              { id: 'cotraitance',    label: 'Cotraitance' },
              { id: 'sous_traitance', label: 'Sous-traitance' },
            ]}
            value={data.type_reponse}
            onChange={v => set('type_reponse', v)}
          />
        </Field>

        <Field label="Supervision en sous-traitance">
          <Inp value={data.supervision_sous_traitance} onChange={v => set('supervision_sous_traitance', v)} />
        </Field>
      </SectionCard>

      {/* ── Section 3 – Planning ──────────────────────────────────────────── */}
      <SectionCard title="3 · Planning" color="bg-amber-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Réception DCE">
            <Inp value={data.planning_reception_dce} onChange={v => set('planning_reception_dce', v)} placeholder="JJ/MM/AAAA" />
          </Field>
          <Field label="COMECO">
            <Inp value={data.planning_comeco} onChange={v => set('planning_comeco', v)} placeholder="JJ/MM/AAAA" />
          </Field>
          <Field label="Lancement interne">
            <Inp value={data.planning_lancement_interne} onChange={v => set('planning_lancement_interne', v)} placeholder="JJ/MM/AAAA" />
          </Field>
          <Field label="Bouclage">
            <Inp value={data.planning_bouclage} onChange={v => set('planning_bouclage', v)} placeholder="JJ/MM/AAAA" />
          </Field>
          <Field label="Remise offre">
            <Inp value={data.planning_remise_offre} onChange={v => set('planning_remise_offre', v)} placeholder="JJ/MM/AAAA" />
          </Field>
          <Field label="Planning projet">
            <Inp value={data.planning_projet} onChange={v => set('planning_projet', v)} placeholder="ex: 18 mois" />
          </Field>
        </div>
      </SectionCard>

      {/* ── Section 4 – Solution ─────────────────────────────────────────── */}
      <SectionCard title="4 · Solution" color="bg-cyan-500">
        <Field label="Analyse des prestations / Prérequis">
          <Txta value={data.analyse_prestations} onChange={v => set('analyse_prestations', v)} rows={4} />
        </Field>
        <Field label="Organisation interne">
          <Txta value={data.organisation_interne} onChange={v => set('organisation_interne', v)} rows={3} />
        </Field>
      </SectionCard>

      {/* ── Section 5 – Aspects contractuels ────────────────────────────── */}
      <SectionCard title="5 · Aspects contractuels" color="bg-pink-500">
        <Field label="Aspects contractuels">
          <Txta value={data.aspects_contractuels} onChange={v => set('aspects_contractuels', v)} rows={4} />
        </Field>
      </SectionCard>

      {/* ── Section 6 – Chiffrage ────────────────────────────────────────── */}
      <SectionCard title="6 · Chiffrage" color="bg-emerald-500">
        <Field label="Hypothèses de chiffrage">
          <Txta value={data.hypotheses_chiffrage} onChange={v => set('hypotheses_chiffrage', v)} rows={3} />
        </Field>
        <Field label="Feuille de vente">
          <Txta value={data.feuille_vente} onChange={v => set('feuille_vente', v)} rows={3} />
        </Field>
        <Field label="Aléas">
          <Txta value={data.aleas} onChange={v => set('aleas', v)} rows={2} />
        </Field>
      </SectionCard>

      {/* ── Section 7 – Risques ──────────────────────────────────────────── */}
      <SectionCard title="7 · Risques & opportunités" color="bg-orange-500">
        <Field label="Risques opérationnels">
          <Txta value={data.risques_operationnels} onChange={v => set('risques_operationnels', v)} rows={3} />
        </Field>
        <Field label="Risques financiers">
          <Txta value={data.risques_financiers} onChange={v => set('risques_financiers', v)} rows={3} />
        </Field>
        <Field label="Opportunités">
          <Txta value={data.opportunites} onChange={v => set('opportunites', v)} rows={3} />
        </Field>
      </SectionCard>

      {/* ── Section 8 – Décisions ────────────────────────────────────────── */}
      <SectionCard title="8 · Décisions" color="bg-rose-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Responsable étude">
            <Inp value={data.responsable_etude} onChange={v => set('responsable_etude', v)} />
          </Field>
          <Field label="Date remise étude commerce">
            <Inp value={data.date_remise_etude} onChange={v => set('date_remise_etude', v)} placeholder="JJ/MM/AAAA" />
          </Field>
        </div>
      </SectionCard>

      {/* ── Feedback ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Sticky save / export bar ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e1117]/90 backdrop-blur-md border-t border-white/8 px-4 py-3 flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 mr-auto">
            <CheckCircle size={13} />Sauvegardé
          </span>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40"
        >
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {exporting ? 'Génération...' : 'Exporter Word'}
        </button>
      </div>
    </div>
  )
}
