/**
 * Pilot+ Synthèse Corporate — PDF Template
 * Renders a professional A4 document for executive distribution.
 */

import React from 'react'
import {
  Document, Page, View, Text, StyleSheet, Font,
} from '@react-pdf/renderer'

// ─── Colour palette ────────────────────────────────────────────────────────────
const C = {
  navy:        '#0f1b35',
  navyLight:   '#1a2d52',
  blue:        '#1d4ed8',
  blueLight:   '#3b82f6',
  bluePale:    '#eff6ff',
  accent:      '#0ea5e9',
  green:       '#16a34a',
  greenPale:   '#f0fdf4',
  red:         '#dc2626',
  redPale:     '#fef2f2',
  amber:       '#d97706',
  amberPale:   '#fffbeb',
  violet:      '#7c3aed',
  violetPale:  '#f5f3ff',
  white:       '#ffffff',
  gray50:      '#f8fafc',
  gray100:     '#f1f5f9',
  gray200:     '#e2e8f0',
  gray400:     '#94a3b8',
  gray600:     '#475569',
  gray700:     '#334155',
  gray900:     '#0f172a',
  text:        '#1e293b',
  textMuted:   '#64748b',
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 0,
    paddingBottom: 32,
  },

  // Cover
  cover: {
    backgroundColor: C.navy,
    padding: 48,
    paddingBottom: 40,
    minHeight: 200,
  },
  coverBadge: {
    backgroundColor: C.blue,
    color: C.white,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    marginBottom: 6,
    lineHeight: 1.2,
  },
  coverClient: {
    fontSize: 13,
    color: '#93c5fd',
    marginBottom: 20,
  },
  coverMeta: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  coverMetaItem: {
    flex: 1,
  },
  coverMetaLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    marginBottom: 3,
  },
  coverMetaValue: {
    fontSize: 9,
    color: C.white,
  },

  // Verdict banner (below cover)
  verdictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 10,
    gap: 12,
  },
  verdictLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: C.textMuted,
  },
  verdictPill: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 100,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  verdictScore: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 'auto',
  },

  // Page content
  content: {
    paddingHorizontal: 36,
    paddingTop: 20,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 18,
    gap: 8,
  },
  sectionBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    letterSpacing: 0.3,
  },
  sectionNum: {
    fontSize: 8,
    color: C.textMuted,
    marginLeft: 2,
  },

  // Two-column grid
  row2: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },

  // Field
  fieldLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.textMuted,
    letterSpacing: 0.8,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.5,
    backgroundColor: C.gray50,
    padding: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.gray200,
    minHeight: 24,
  },
  fieldValueEmpty: {
    color: C.gray400,
    fontStyle: 'italic',
  },

  // Executive summary box
  summaryBox: {
    backgroundColor: C.bluePale,
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 9,
    color: C.navyLight,
    lineHeight: 1.6,
  },

  // Tag chips (checkboxes)
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 100,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  chipActive: {
    backgroundColor: C.bluePale,
    color: C.blue,
  },
  chipInactive: {
    backgroundColor: C.gray100,
    color: C.gray400,
  },

  // SWOT table
  swotGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  swotCell: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    minHeight: 60,
  },
  swotCellGreen:  { backgroundColor: C.greenPale,  borderWidth: 1, borderColor: '#bbf7d0' },
  swotCellRed:    { backgroundColor: C.redPale,    borderWidth: 1, borderColor: '#fecaca' },
  swotCellAmber:  { backgroundColor: C.amberPale,  borderWidth: 1, borderColor: '#fde68a' },
  swotCellViolet: { backgroundColor: C.violetPale, borderWidth: 1, borderColor: '#ddd6fe' },
  swotLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  swotText: {
    fontSize: 8.5,
    lineHeight: 1.5,
  },

  // Planning timeline
  planningRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
    paddingVertical: 5,
  },
  planningLabel: {
    width: 160,
    fontSize: 8.5,
    color: C.gray600,
  },
  planningValue: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
  },

  // Risks table
  riskBox: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  riskBoxOp:  { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  riskBoxFin: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  riskBoxOpp: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  riskTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  riskText: {
    fontSize: 8.5,
    lineHeight: 1.5,
  },

  // Points de vigilance
  vigilanceItem: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  vigilanceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.amber,
    marginTop: 3,
    flexShrink: 0,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: C.gray200,
    marginVertical: 12,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: C.gray400,
  },
  footerPageNum: {
    fontSize: 7,
    color: C.gray400,
  },
})

// ─── Helpers ───────────────────────────────────────────────────────────────────

function val(v: string | undefined, fallback = '—') {
  return v?.trim() || fallback
}

function SectionHeader({ num, title, color }: { num: string; title: string; color: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionBar, { backgroundColor: color }]} />
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionNum}>{num}</Text>
    </View>
  )
}

function Field({ label, value, empty }: { label: string; value?: string; empty?: string }) {
  const isEmpty = !value?.trim()
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={[s.fieldValue, isEmpty ? s.fieldValueEmpty : {}]}>
        {isEmpty ? (empty ?? '—') : value}
      </Text>
    </View>
  )
}

function Chips({ label, options, active }: { label: string; options: { id: string; label: string }[]; active: string[] }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.chips}>
        {options.map(o => (
          <Text key={o.id} style={[s.chip, active.includes(o.id) ? s.chipActive : s.chipInactive]}>
            {active.includes(o.id) ? '✓ ' : ''}{o.label}
          </Text>
        ))}
      </View>
    </View>
  )
}

// ─── Main PDF document ─────────────────────────────────────────────────────────

export interface SynthesePDFProps {
  synthese: Record<string, unknown>
  project: { name: string; client: string; location: string; offer_deadline?: string | null }
  score?: { total_score: number; verdict: string } | null
  analysisPoints?: string[]
  analysisVigilance?: string[]
  analysisResume?: string
}

export function SynthesePDFDocument({
  synthese: raw, project, score, analysisPoints = [], analysisVigilance = [], analysisResume,
}: SynthesePDFProps) {
  const sy = raw as Record<string, string & string[]>

  const typeAccord   = (sy.type_accord     as unknown as string[]) ?? []
  const modeComp     = (sy.mode_comparaison as unknown as string[]) ?? []
  const validite     = (sy.validite_type   as unknown as string[]) ?? []
  const typeReponse  = (sy.type_reponse    as unknown as string[]) ?? []

  const verdictColors: Record<string, { bg: string; text: string }> = {
    GO:        { bg: '#dcfce7', text: '#166534' },
    A_ETUDIER: { bg: '#fef9c3', text: '#854d0e' },
    NO_GO:     { bg: '#fee2e2', text: '#991b1b' },
  }
  const vc = score ? (verdictColors[score.verdict] ?? verdictColors.A_ETUDIER) : null

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document title={`Synthèse Corporate — ${project.name}`} author="Pilot+">

      {/* ════════════════════════════════════════════════════════════
          PAGE 1 — Cover + Synthèse exécutive + Contexte client
          ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>

        {/* Cover */}
        <View style={s.cover}>
          <Text style={s.coverBadge}>SYNTHÈSE CORPORATE — CONFIDENTIEL</Text>
          <Text style={s.coverTitle}>{val(sy.nom_projet_synthese as string, project.name)}</Text>
          <Text style={s.coverClient}>{val(sy.client_maitre_ouvrage as string, project.client)}</Text>

          <View style={s.coverMeta}>
            <View style={s.coverMetaItem}>
              <Text style={s.coverMetaLabel}>Localisation</Text>
              <Text style={s.coverMetaValue}>{val(project.location as string)}</Text>
            </View>
            <View style={s.coverMetaItem}>
              <Text style={s.coverMetaLabel}>Date remise offre</Text>
              <Text style={s.coverMetaValue}>{val(sy.planning_remise_offre as string, project.offer_deadline ?? '—')}</Text>
            </View>
            <View style={s.coverMetaItem}>
              <Text style={s.coverMetaLabel}>Montant projet</Text>
              <Text style={s.coverMetaValue}>{val(sy.montant_projet as string)}</Text>
            </View>
            <View style={s.coverMetaItem}>
              <Text style={s.coverMetaLabel}>Généré le</Text>
              <Text style={s.coverMetaValue}>{today}</Text>
            </View>
          </View>
        </View>

        {/* Verdict banner */}
        {score && vc && (
          <View style={[s.verdictBanner, { backgroundColor: vc.bg }]}>
            <Text style={s.verdictLabel}>DÉCISION GO / NO GO</Text>
            <Text style={[s.verdictPill, { backgroundColor: vc.bg, color: vc.text, borderWidth: 1, borderColor: vc.text + '44' }]}>
              {score.verdict.replace('_', ' ')}
            </Text>
            <Text style={[s.verdictScore, { color: vc.text, marginLeft: 'auto' }]}>
              {score.total_score}/100
            </Text>
          </View>
        )}

        <View style={s.content}>

          {/* Synthèse exécutive */}
          {(analysisResume || sy.besoin_description) && (
            <>
              <SectionHeader num="0" title="Synthèse exécutive" color={C.accent} />
              <View style={s.summaryBox}>
                <Text style={s.summaryText}>
                  {val(analysisResume || (sy.besoin_description as string))}
                </Text>
              </View>
            </>
          )}

          {/* Points de vigilance */}
          {analysisVigilance.length > 0 && (
            <>
              <Text style={[s.fieldLabel, { marginBottom: 5, marginTop: 4 }]}>⚠ POINTS DE VIGILANCE</Text>
              {analysisVigilance.slice(0, 4).map((pt, i) => (
                <View key={i} style={s.vigilanceItem}>
                  <View style={s.vigilanceDot} />
                  <Text style={{ fontSize: 8.5, lineHeight: 1.4, flex: 1, color: C.gray700 }}>{pt}</Text>
                </View>
              ))}
            </>
          )}

          <View style={s.divider} />

          {/* Section 1 — Contexte client */}
          <SectionHeader num="01" title="Contexte client" color={C.blue} />
          <View style={s.row2}>
            <View style={s.col}>
              <Field label="Client / Maître d'ouvrage" value={sy.client_maitre_ouvrage as string} />
              <Field label="Opportunité CRM"           value={sy.opportunite_crm as string} />
              <Field label="Typologie client"          value={sy.typologie_client as string} />
            </View>
            <View style={s.col}>
              <Field label="Objet du marché"   value={sy.marche_objet as string} />
              <Field label="Besoin client"      value={sy.besoin_client as string} />
              <Field label="Matériel à installer" value={sy.materiel_installer as string} />
            </View>
          </View>
          <Field label="Description du marché" value={sy.marche_description as string} />

        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>PILOT+ · Synthèse Corporate · {project.name}</Text>
          <Text style={s.footerPageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ════════════════════════════════════════════════════════════
          PAGE 2 — Commercial + Analyse stratégique
          ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={[s.content, { paddingTop: 32 }]}>

          {/* Section 2 — Contexte commercial */}
          <SectionHeader num="02" title="Contexte commercial" color={C.violet} />
          <View style={s.row2}>
            <View style={s.col}>
              <Field label="Type d'appel d'offres" value={sy.type_ao as string} />
              <Field label="Montant projet"         value={sy.montant_projet as string} />
              <Field label="Durée de contrat"       value={sy.duree_contrat as string} />
            </View>
            <View style={s.col}>
              <Field label="Environnement de l'offre" value={sy.environnement_offre as string} />
              <Field label="Nature des prix"           value={sy.nature_prix as string} />
              <Field label="Durée de validité"         value={sy.duree_validite as string} />
            </View>
          </View>

          <View style={s.row2}>
            <View style={s.col}>
              <Chips
                label="Type d'accord"
                options={[
                  { id: 'forfait', label: 'Forfait' },
                  { id: 'bpu',     label: 'BPU' },
                  { id: 'bpf',     label: 'BPF' },
                ]}
                active={typeAccord}
              />
            </View>
            <View style={s.col}>
              <Chips
                label="Mode de comparaison"
                options={[
                  { id: 'dpgf',     label: 'DPGF' },
                  { id: 'dqe_bpu',  label: 'DQE/BPU' },
                  { id: 'liste_pu', label: 'Liste PU' },
                  { id: 'devis',    label: 'Devis' },
                ]}
                active={modeComp}
              />
            </View>
          </View>

          <View style={s.row2}>
            <View style={s.col}>
              <Chips
                label="Type de validité"
                options={[
                  { id: 'ferme',        label: 'Ferme' },
                  { id: 'actualisable', label: 'Actualisable' },
                  { id: 'revisable',    label: 'Révisable' },
                ]}
                active={validite}
              />
            </View>
            <View style={s.col}>
              <Chips
                label="Type de réponse"
                options={[
                  { id: 'seul',           label: 'Seul' },
                  { id: 'cotraitance',    label: 'Cotraitance' },
                  { id: 'sous_traitance', label: 'Sous-traitance' },
                ]}
                active={typeReponse}
              />
            </View>
          </View>

          <View style={s.row2}>
            <View style={s.col}>
              <Field label="Négociation prévue" value={(sy.negociation_prevue as unknown as boolean) ? '✓ Oui' : '✗ Non'} />
            </View>
            <View style={s.col}>
              <Field label="Visite technique" value={(sy.visite_technique as unknown as boolean) ? '✓ Oui' : '✗ Non'} />
            </View>
            <View style={s.col}>
              <Field label="Supervision sous-traitance" value={sy.supervision_sous_traitance as string} />
            </View>
          </View>

          <View style={s.row2}>
            <View style={s.col}><Field label="Critère 1" value={sy.critere_1 as string} /></View>
            <View style={s.col}><Field label="Critère 2" value={sy.critere_2 as string} /></View>
            <View style={s.col}><Field label="Critère 3" value={sy.critere_3 as string} /></View>
          </View>

          <View style={s.divider} />

          {/* Section 3 — Analyse stratégique */}
          <SectionHeader num="03" title="Analyse stratégique" color="#16a34a" />
          <View style={s.swotGrid}>
            <View style={[s.swotCell, s.swotCellGreen]}>
              <Text style={[s.swotLabel, { color: '#166534' }]}>✦ ATOUTS</Text>
              <Text style={[s.swotText, { color: '#166534' }]}>{val(sy.atouts as string)}</Text>
            </View>
            <View style={[s.swotCell, s.swotCellRed]}>
              <Text style={[s.swotLabel, { color: '#991b1b' }]}>✦ FAIBLESSES</Text>
              <Text style={[s.swotText, { color: '#991b1b' }]}>{val(sy.faiblesses as string)}</Text>
            </View>
          </View>

          <Field label="Concurrence identifiée"  value={sy.concurrence_identifiee as string} />
          <Field label="Stratégie de réponse"     value={sy.strategie_reponse as string} />

        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>PILOT+ · Synthèse Corporate · {project.name}</Text>
          <Text style={s.footerPageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ════════════════════════════════════════════════════════════
          PAGE 3 — Planning + Solution + Contractuel + Chiffrage
          ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={[s.content, { paddingTop: 32 }]}>

          {/* Section 4 — Planning */}
          <SectionHeader num="04" title="Planning" color={C.amber} />
          {[
            ['Réception DCE',       sy.planning_reception_dce],
            ['COMECO',              sy.planning_comeco],
            ['Lancement interne',   sy.planning_lancement_interne],
            ['Bouclage',            sy.planning_bouclage],
            ['Remise offre',        sy.planning_remise_offre],
            ['Planning projet',     sy.planning_projet],
          ].map(([label, value]) => (
            <View key={label as string} style={s.planningRow}>
              <Text style={s.planningLabel}>{label as string}</Text>
              <Text style={s.planningValue}>{val(value as string)}</Text>
            </View>
          ))}

          <View style={s.divider} />

          {/* Section 5 — Solution */}
          <SectionHeader num="05" title="Solution & Organisation" color="#0891b2" />
          <Field label="Analyse des prestations / Prérequis" value={sy.analyse_prestations as string} />
          <Field label="Organisation interne"                 value={sy.organisation_interne as string} />

          <View style={s.divider} />

          {/* Section 6 — Contractuel */}
          <SectionHeader num="06" title="Aspects contractuels" color="#db2777" />
          <Field label="Aspects contractuels" value={sy.aspects_contractuels as string} />

          <View style={s.divider} />

          {/* Section 7 — Chiffrage */}
          <SectionHeader num="07" title="Chiffrage" color="#16a34a" />
          <Field label="Hypothèses de chiffrage" value={sy.hypotheses_chiffrage as string} />
          <View style={s.row2}>
            <View style={s.col}>
              <Field label="Feuille de vente" value={sy.feuille_vente as string} />
            </View>
            <View style={s.col}>
              <Field label="Aléas" value={sy.aleas as string} />
            </View>
          </View>

        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>PILOT+ · Synthèse Corporate · {project.name}</Text>
          <Text style={s.footerPageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ════════════════════════════════════════════════════════════
          PAGE 4 — Risques + Décision + Actions
          ════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={[s.content, { paddingTop: 32 }]}>

          {/* Section 8 — Risques */}
          <SectionHeader num="08" title="Risques & Opportunités" color="#ea580c" />
          <View style={[s.riskBox, s.riskBoxOp]}>
            <Text style={[s.riskTitle, { color: '#c2410c' }]}>⚠ RISQUES OPÉRATIONNELS</Text>
            <Text style={[s.riskText, { color: '#9a3412' }]}>{val(sy.risques_operationnels as string)}</Text>
          </View>
          <View style={[s.riskBox, s.riskBoxFin]}>
            <Text style={[s.riskTitle, { color: '#b91c1c' }]}>⚠ RISQUES FINANCIERS</Text>
            <Text style={[s.riskText, { color: '#991b1b' }]}>{val(sy.risques_financiers as string)}</Text>
          </View>
          <View style={[s.riskBox, s.riskBoxOpp]}>
            <Text style={[s.riskTitle, { color: '#15803d' }]}>✦ OPPORTUNITÉS</Text>
            <Text style={[s.riskText, { color: '#166534' }]}>{val(sy.opportunites as string)}</Text>
          </View>

          <View style={s.divider} />

          {/* Section 9 — Décision */}
          <SectionHeader num="09" title="Décision & Responsabilités" color={C.navy} />
          {score && vc && (
            <View style={{ backgroundColor: vc.bg, padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: vc.text + '33' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: vc.text, letterSpacing: 1, marginBottom: 2 }}>DÉCISION GO / NO GO</Text>
                  <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: vc.text }}>{score.verdict.replace('_', ' ')}</Text>
                </View>
                <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 7, color: vc.text, letterSpacing: 1, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>SCORE GLOBAL</Text>
                  <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: vc.text }}>{score.total_score}<Text style={{ fontSize: 14 }}>/100</Text></Text>
                </View>
              </View>
            </View>
          )}

          <View style={s.row2}>
            <View style={s.col}>
              <Field label="Responsable étude"           value={sy.responsable_etude as string} />
            </View>
            <View style={s.col}>
              <Field label="Date remise étude commerce"  value={sy.date_remise_etude as string} />
            </View>
          </View>

          {/* Points clés de l'analyse */}
          {analysisPoints.length > 0 && (
            <>
              <View style={s.divider} />
              <SectionHeader num="10" title="Points clés de l'analyse IA" color={C.accent} />
              {analysisPoints.slice(0, 6).map((pt, i) => (
                <View key={i} style={[s.vigilanceItem, { marginBottom: 5 }]}>
                  <View style={[s.vigilanceDot, { backgroundColor: C.accent }]} />
                  <Text style={{ fontSize: 8.5, lineHeight: 1.4, flex: 1, color: C.gray700 }}>{pt}</Text>
                </View>
              ))}
            </>
          )}

          {/* Confidential footer */}
          <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.gray200, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 7, color: C.gray400 }}>Document généré par PILOT+ — Usage interne confidentiel</Text>
            <Text style={{ fontSize: 7, color: C.gray400 }}>{today}</Text>
          </View>

        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>PILOT+ · Synthèse Corporate · {project.name}</Text>
          <Text style={s.footerPageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

    </Document>
  )
}
