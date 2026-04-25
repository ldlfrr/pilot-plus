/**
 * PILOT+ — Brief Avant-Vente PDF
 * 1-page summary for pre-sales team handoff.
 */

import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const C = {
  navy:      '#0a1628',
  navyMid:   '#112240',
  blue:      '#1d4ed8',
  blueLight: '#3b82f6',
  accent:    '#60a5fa',
  green:     '#16a34a',
  red:       '#dc2626',
  amber:     '#d97706',
  white:     '#ffffff',
  gray100:   '#f1f5f9',
  gray200:   '#e2e8f0',
  gray400:   '#94a3b8',
  gray600:   '#475569',
  gold:      '#f59e0b',
}

const S = StyleSheet.create({
  page:       { backgroundColor: C.navy, padding: 0, fontFamily: 'Helvetica' },

  // ── Top strip ────────────────────────────────────────────────────────────────
  topBar:     { backgroundColor: C.blue, paddingHorizontal: 32, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topLogo:    { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  topLabel:   { fontSize: 7.5, color: '#93c5fd', letterSpacing: 2 },
  topDate:    { fontSize: 7, color: '#bfdbfe' },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero:       { backgroundColor: C.navyMid, paddingHorizontal: 32, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e3a5f' },
  heroTitle:  { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, marginBottom: 4 },
  heroMeta:   { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaLabel: { fontSize: 7.5, color: C.gray400 },
  heroMetaValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#93c5fd' },

  // ── Deadline pill ────────────────────────────────────────────────────────────
  deadlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#7c2d12', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  deadlineText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fca5a5' },

  // ── Body ────────────────────────────────────────────────────────────────────
  body:       { flexDirection: 'row', flex: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12, gap: 18 },
  colLeft:    { flex: 3, gap: 14 },
  colRight:   { flex: 2, gap: 14 },

  // ── Card ────────────────────────────────────────────────────────────────────
  card:       { backgroundColor: C.navyMid, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1e3a5f' },
  cardTitle:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 },
  cardText:   { fontSize: 8, color: C.gray200, lineHeight: 1.55 },

  // ── Points list ─────────────────────────────────────────────────────────────
  point:      { flexDirection: 'row', gap: 5, marginBottom: 4 },
  pointDot:   { fontSize: 10, color: C.accent, lineHeight: 1.3 },
  pointText:  { fontSize: 8, color: C.gray200, flex: 1, lineHeight: 1.5 },

  // ── Intervenants ────────────────────────────────────────────────────────────
  intervRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 5 },
  intervDot:  { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center' },
  intervInit: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.accent },
  intervInfo: { flex: 1 },
  intervName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white },
  intervRole: { fontSize: 6.5, color: C.gray400 },

  // ── Budget / score ───────────────────────────────────────────────────────────
  scoreRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoreBox:   { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center' },
  scoreNum:   { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.accent },
  scoreLabel: { fontSize: 7, color: C.gray400 },
  verdictPill:{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  verdictText:{ fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // ── Risks ────────────────────────────────────────────────────────────────────
  riskRow:    { flexDirection: 'row', gap: 5, marginBottom: 3 },
  riskDot:    { fontSize: 9, color: '#f87171', lineHeight: 1.4 },
  riskText:   { fontSize: 7.5, color: '#fca5a5', flex: 1, lineHeight: 1.5 },

  // ── Chiffrage status ─────────────────────────────────────────────────────────
  chiffrRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  chiffrLabel:{ fontSize: 8, color: C.gray400, flex: 1 },
  chiffrVal:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white },

  // ── Bottom strip ────────────────────────────────────────────────────────────
  bottomBar:  { backgroundColor: '#070f1e', paddingHorizontal: 32, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomText: { fontSize: 7, color: '#334155' },
  bottomAccent:{ fontSize: 7, color: '#60a5fa' },
})

const ROLE_LABELS: Record<string, string> = {
  commercial:       'Commercial',
  directeur_agence: 'Dir. Agence',
  charge_affaires:  "Chargé d'affaires",
  avant_vente:      'Avant-vente',
}

const CHIFFRAGE_LABELS: Record<string, string> = {
  a_chiffrer: 'À chiffrer',
  en_cours:   'En cours',
  chiffre:    'Chiffré',
  valide:     'Validé',
}

export interface BriefAvantVenteProps {
  projectName:   string
  client:        string
  location:      string
  offerDeadline: string | null
  daysLeft:      number | null
  summary:       string
  keyPoints:     string[]
  risks:         string[]
  intervenants:  Array<{ role: string; name: string; email?: string }>
  score?:        number | null
  verdict?:      string | null
  budget?:       string
  chiffrage?:    { status: string; montant?: number; notes?: string } | null
  instruction:   string   // AI-generated action instruction for avant-vente
  userCompany:   string
  generatedAt:   string
}

export function BriefAvantVentePDF(props: BriefAvantVenteProps) {
  const {
    projectName, client, location, offerDeadline, daysLeft,
    summary, keyPoints, risks, intervenants, score, verdict, budget,
    chiffrage, instruction, userCompany, generatedAt,
  } = props

  const verdictColor = verdict === 'GO' ? C.green : verdict === 'NO_GO' ? C.red : C.amber
  const verdictBg    = verdict === 'GO' ? '#14532d' : verdict === 'NO_GO' ? '#7f1d1d' : '#78350f'

  const deadlineStr = offerDeadline
    ? new Date(offerDeadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const avantVentes = intervenants.filter(i => i.role === 'avant_vente')
  const autres      = intervenants.filter(i => i.role !== 'avant_vente')

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page}>

        {/* Top bar */}
        <View style={S.topBar}>
          <View>
            <Text style={S.topLogo}>PILOT<Text style={{ color: C.accent }}>+</Text></Text>
            <Text style={S.topLabel}>BRIEF AVANT-VENTE</Text>
          </View>
          {deadlineStr && daysLeft !== null && (
            <View style={S.deadlinePill}>
              <Text style={S.deadlineText}>
                {daysLeft <= 0 ? 'DEADLINE DÉPASSÉE' : `J−${daysLeft} — ${deadlineStr}`}
              </Text>
            </View>
          )}
          <Text style={S.topDate}>Généré le {generatedAt} · {userCompany}</Text>
        </View>

        {/* Hero */}
        <View style={S.hero}>
          <Text style={S.heroTitle}>{projectName}</Text>
          <View style={S.heroMeta}>
            <View style={S.heroMetaItem}>
              <Text style={S.heroMetaLabel}>Client :</Text>
              <Text style={S.heroMetaValue}>{client}</Text>
            </View>
            <View style={S.heroMetaItem}>
              <Text style={S.heroMetaLabel}>Localisation :</Text>
              <Text style={S.heroMetaValue}>{location}</Text>
            </View>
            {budget && (
              <View style={S.heroMetaItem}>
                <Text style={S.heroMetaLabel}>Budget estimé :</Text>
                <Text style={S.heroMetaValue}>{budget}</Text>
              </View>
            )}
            {verdict && (
              <View style={[S.verdictPill, { backgroundColor: verdictBg }]}>
                <Text style={[S.verdictText, { color: verdictColor }]}>
                  {verdict === 'A_ETUDIER' ? 'À ÉTUDIER' : verdict}
                  {score != null ? `  ${score}/100` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Body */}
        <View style={S.body}>

          {/* Left column */}
          <View style={S.colLeft}>

            {/* Summary */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Contexte & enjeux</Text>
              <Text style={S.cardText}>{summary}</Text>
            </View>

            {/* Key points */}
            {keyPoints.length > 0 && (
              <View style={S.card}>
                <Text style={S.cardTitle}>Points clés à traiter</Text>
                {keyPoints.slice(0, 5).map((pt, i) => (
                  <View key={i} style={S.point}>
                    <Text style={S.pointDot}>›</Text>
                    <Text style={S.pointText}>{pt}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI instruction */}
            <View style={[S.card, { borderColor: '#1e3a8a', borderWidth: 1.5 }]}>
              <Text style={S.cardTitle}>Instruction avant-vente</Text>
              <Text style={[S.cardText, { color: '#bfdbfe' }]}>{instruction}</Text>
            </View>
          </View>

          {/* Right column */}
          <View style={S.colRight}>

            {/* Score block */}
            {score != null && (
              <View style={S.card}>
                <Text style={S.cardTitle}>Score Go / No Go</Text>
                <View style={S.scoreRow}>
                  <View style={S.scoreBox}>
                    <Text style={S.scoreNum}>{score}</Text>
                  </View>
                  <View>
                    <Text style={[S.cardText, { marginBottom: 2 }]}>Score sur 100</Text>
                    {verdict && (
                      <View style={[S.verdictPill, { backgroundColor: verdictBg }]}>
                        <Text style={[S.verdictText, { color: verdictColor }]}>
                          {verdict === 'A_ETUDIER' ? 'À ÉTUDIER' : verdict}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Chiffrage */}
            {chiffrage && (
              <View style={S.card}>
                <Text style={S.cardTitle}>Chiffrage</Text>
                <View style={S.chiffrRow}>
                  <Text style={S.chiffrLabel}>Statut</Text>
                  <Text style={S.chiffrVal}>{CHIFFRAGE_LABELS[chiffrage.status] ?? chiffrage.status}</Text>
                </View>
                {chiffrage.montant != null && (
                  <View style={S.chiffrRow}>
                    <Text style={S.chiffrLabel}>Montant estimé</Text>
                    <Text style={S.chiffrVal}>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(chiffrage.montant)}
                    </Text>
                  </View>
                )}
                {chiffrage.notes && (
                  <Text style={[S.cardText, { marginTop: 4 }]}>{chiffrage.notes}</Text>
                )}
              </View>
            )}

            {/* Risks */}
            {risks.length > 0 && (
              <View style={S.card}>
                <Text style={S.cardTitle}>Risques identifiés</Text>
                {risks.slice(0, 3).map((r, i) => (
                  <View key={i} style={S.riskRow}>
                    <Text style={S.riskDot}>⚠</Text>
                    <Text style={S.riskText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Intervenants */}
            {intervenants.length > 0 && (
              <View style={S.card}>
                <Text style={S.cardTitle}>Équipe projet</Text>
                {[...avantVentes, ...autres].slice(0, 4).map((iv, i) => {
                  const initials = iv.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <View key={i} style={S.intervRow}>
                      <View style={S.intervDot}>
                        <Text style={S.intervInit}>{initials}</Text>
                      </View>
                      <View style={S.intervInfo}>
                        <Text style={S.intervName}>{iv.name}</Text>
                        <Text style={S.intervRole}>{ROLE_LABELS[iv.role] ?? iv.role}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </View>

        {/* Bottom bar */}
        <View style={S.bottomBar}>
          <Text style={S.bottomText}>Document confidentiel · {userCompany}</Text>
          <Text style={S.bottomAccent}>pilot-plus.fr</Text>
          <Text style={S.bottomText}>Généré avec PILOT+ · {generatedAt}</Text>
        </View>

      </Page>
    </Document>
  )
}
