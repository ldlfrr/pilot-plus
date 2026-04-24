export const runtime = 'nodejs'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

interface Params { params: Promise<{ id: string }> }

// Checkbox helper: returns ☑ if condition is true, else ☐
function chk(condition: boolean): string {
  return condition ? '☑' : '☐'
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Load synthese data
  const { data: synthese } = await supabase
    .from('project_syntheses')
    .select('*')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .single()

  if (!synthese) return NextResponse.json({ error: 'Aucune synthèse trouvée' }, { status: 404 })

  // Check for custom template
  const { data: settingsRow } = await supabase
    .from('company_settings')
    .select('synthese_template_path')
    .eq('user_id', user.id)
    .single()

  let templateBuffer: Buffer

  if (settingsRow?.synthese_template_path) {
    // Load custom template from Supabase storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('synthese-templates')
      .download(settingsRow.synthese_template_path)

    if (storageError || !fileData) {
      // Fall back to default template
      templateBuffer = fs.readFileSync(
        path.join(process.cwd(), 'public', 'templates', 'sogetrel-template.docx')
      )
    } else {
      templateBuffer = Buffer.from(await fileData.arrayBuffer())
    }
  } else {
    templateBuffer = fs.readFileSync(
      path.join(process.cwd(), 'public', 'templates', 'sogetrel-template.docx')
    )
  }

  // Build the replacement values
  const typeAccord    = (synthese.type_accord    || []) as string[]
  const modeComp      = (synthese.mode_comparaison || []) as string[]
  const validiteTypes = (synthese.validite_type  || []) as string[]
  const typeReponse   = (synthese.type_reponse   || []) as string[]

  const values: Record<string, string> = {
    client_maitre_ouvrage:       synthese.client_maitre_ouvrage       || '',
    nom_projet:                  synthese.nom_projet_synthese          || '',
    chk_c1:                      chk(synthese.typologie_client === 'C1'),
    chk_c2:                      chk(synthese.typologie_client === 'C2'),
    chk_c3:                      chk(synthese.typologie_client === 'C3'),
    opportunite_crm:             synthese.opportunite_crm             || '',
    besoin_description:          synthese.besoin_description          || '',
    marche_description:          synthese.marche_description          || '',
    marche_objet:                synthese.marche_objet                || '',
    besoin_client:               synthese.besoin_client               || '',
    materiel_installer:          synthese.materiel_installer          || '',
    type_ao:                     synthese.type_ao                     || '',
    montant_projet:              synthese.montant_projet              || '',
    duree_contrat:               synthese.duree_contrat               || '',
    chk_forfait:                 chk(typeAccord.includes('forfait')),
    chk_bpu:                     chk(typeAccord.includes('bpu')),
    chk_bpf:                     chk(typeAccord.includes('bpf')),
    chk_dpgf:                    chk(modeComp.includes('dpgf')),
    chk_dqe_bpu:                 chk(modeComp.includes('dqe_bpu')),
    chk_liste_pu:                chk(modeComp.includes('liste_pu')),
    chk_devis:                   chk(modeComp.includes('devis')),
    environnement_offre:         synthese.environnement_offre         || '',
    nature_prix:                 synthese.nature_prix                 || '',
    duree_validite:              synthese.duree_validite              || '',
    chk_ferme:                   chk(validiteTypes.includes('ferme')),
    chk_actualisable:            chk(validiteTypes.includes('actualisable')),
    chk_revisable:               chk(validiteTypes.includes('revisable')),
    negociation_prevue:          synthese.negociation_prevue ? '✓ Oui' : '✗ Non',
    visite_technique:            synthese.visite_technique   ? '✓ Oui' : '✗ Non',
    critere_1:                   synthese.critere_1                   || '',
    critere_2:                   synthese.critere_2                   || '',
    critere_3:                   synthese.critere_3                   || '',
    concurrence_identifiee:      synthese.concurrence_identifiee      || '',
    atouts:                      synthese.atouts                      || '',
    faiblesses:                  synthese.faiblesses                  || '',
    strategie_reponse:           synthese.strategie_reponse           || '',
    chk_seul:                    chk(typeReponse.includes('seul')),
    chk_cotraitance:             chk(typeReponse.includes('cotraitance')),
    chk_sous_traitance:          chk(typeReponse.includes('sous_traitance')),
    supervision_sous_traitance:  synthese.supervision_sous_traitance  || '',
    planning_reception_dce:      synthese.planning_reception_dce      || '',
    planning_comeco:             synthese.planning_comeco             || '',
    planning_lancement_interne:  synthese.planning_lancement_interne  || '',
    planning_bouclage:           synthese.planning_bouclage           || '',
    planning_remise_offre:       synthese.planning_remise_offre       || '',
    planning_projet:             synthese.planning_projet             || '',
    analyse_prestations:         synthese.analyse_prestations         || '',
    organisation_interne:        synthese.organisation_interne        || '',
    aspects_contractuels:        synthese.aspects_contractuels        || '',
    hypotheses_chiffrage:        synthese.hypotheses_chiffrage        || '',
    feuille_vente:               synthese.feuille_vente               || '',
    aleas:                       synthese.aleas                       || '',
    risques_operationnels:       synthese.risques_operationnels       || '',
    risques_financiers:          synthese.risques_financiers          || '',
    opportunites:                synthese.opportunites                || '',
    responsable_etude:           synthese.responsable_etude           || '',
    date_remise_etude:           synthese.date_remise_etude           || '',
  }

  // Fill template using docxtemplater
  try {
    const PizZip       = require('pizzip') as typeof import('pizzip')
    const Docxtemplater = require('docxtemplater') as typeof import('docxtemplater')

    const zip = new PizZip(templateBuffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      nullGetter:    () => '',
    })
    doc.render(values)
    const output = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })

    const projectName = (synthese.nom_projet_synthese || 'synthese').replace(/[^a-zA-Z0-9-_]/g, '_')
    const filename    = `Synthese_${projectName}_${new Date().toISOString().slice(0,10)}.docx`

    return new Response(output, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[synthese/export] error:', msg)
    return NextResponse.json({ error: `Erreur génération Word : ${msg}` }, { status: 500 })
  }
}
