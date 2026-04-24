/**
 * Creates sogetrel-template.docx with {placeholder} markers for docxtemplater.
 * Run: node scripts/create-sogetrel-template.js
 */
const fs    = require('fs');
const path  = require('path');
const JSZip = require(path.join(__dirname, '../node_modules/jszip'));

const INPUT  = 'C:/Users/leobl/Downloads/Fiche synthèse 2.docx';
const OUTPUT = path.join(__dirname, '../public/templates/sogetrel-template.docx');

const NBSP = '\u00a0'; // non-breaking space used by Word

async function main() {
  const original = fs.readFileSync(INPUT);
  const zip      = await JSZip.loadAsync(original);
  let xml        = await zip.file('word/document.xml').async('string');

  let ok = 0, fail = 0;
  function rep(from, to, label) {
    const x = xml.replace(from, to);
    if (x === xml) { console.warn('  ✗', label || from.toString().substring(0,60)); fail++; }
    else           { ok++; }
    xml = x;
  }

  // ── Empty-para value areas (identified by Word paraId) ──────────────────────
  // Para 488944D6 = blank line between Table0 and Table1 → Client / MOA value
  rep(/(<w:p[^>]*488944D6[^>]*>)([\s\S]*?)(<\/w:p>)/,
      '$1$2<w:r><w:t>{client_maitre_ouvrage}</w:t></w:r>$3', 'client_maitre_ouvrage para');
  // Para 77E4414D = blank line between Table1 and Table2 → Nom projet value
  rep(/(<w:p[^>]*77E4414D[^>]*>)([\s\S]*?)(<\/w:p>)/,
      '$1$2<w:r><w:t>{nom_projet}</w:t></w:r>$3', 'nom_projet para');

  // ── Inline text fields — append placeholder inside the <w:t> ───────────────
  const nbsp = NBSP; // alias

  // Opportunité CRM (non-breaking spaces in original)
  rep(new RegExp(`(Opportunit\u00e9${nbsp}CRM${nbsp}: )(<\\/w:t>)`),
      '$1{opportunite_crm}$2', 'opportunite_crm');

  // Besoin section
  rep(/(Le besoin du client est )(<\/w:t>)/, '$1{besoin_description}$2', 'besoin_description');
  rep(/(Le pr[eé]sent march[eé] est )(<\/w:t>)/, '$1{marche_description}$2', 'marche_description');
  rep(/(couvrant )(<\/w:t>)/, '$1{marche_objet}$2', 'marche_objet');
  rep(new RegExp(`(Besoin client${nbsp}:)(<\\/w:t>)`), '$1 {besoin_client}$2', 'besoin_client');
  rep(new RegExp(`(Mat[eé]riel a installer${nbsp}: )(<\\/w:t>)`), '$1{materiel_installer}$2', 'materiel_installer');

  // Contexte commercial
  rep(/(<w:t[^>]*>)Type d.Appel d.Offres(<\/w:t>)/, "$1Type d'Appel d'Offres : {type_ao}$2", 'type_ao');
  rep(new RegExp(`(Montant Projet${nbsp})(<\\/w:t>)`), '$1{montant_projet} $2', 'montant_projet');
  rep(/(Dur[eé]e de contrat : )(<\/w:t>)/, '$1{duree_contrat} $2', 'duree_contrat');
  rep(/(Environnement de l.Offre)(<\/w:t>)/, "$1 : {environnement_offre}$2", 'environnement_offre');
  rep(/(Nature des Prix)(<\/w:t>)/, '$1 : {nature_prix}$2', 'nature_prix');
  rep(/(Dur[eé]e de Validit[eé] de l.Offre)(<\/w:t>)/, "$1 : {duree_validite}$2", 'duree_validite');

  // Négociation / Visite (split across runs → simpler approach: replace closing run text)
  rep(/(n[eé]gociation)(<\/w:t>)/, '$1 {negociation_prevue}$2', 'negociation');
  rep(/(Visite Technique .+ pr[eé]voir)(<\/w:t>)/, '$1 {visite_technique}$2', 'visite');

  // Critères — "Critère " is in one run, the number in the next; append to number run
  // We match the number run: <w:t>1 </w:t>, <w:t>2  </w:t>, <w:t>3 </w:t>
  // But these may be just "1 " — let's find them in context
  // Find the 3 "Critère " paragraphs and in each one look for the number run
  let critCount = 0;
  const critNums = ['{critere_1}', '{critere_2}', '{critere_3}'];
  xml = xml.replace(/(<w:t[^>]*>Crit[eè]re\s+<\/w:t>[\s\S]*?<w:t[^>]*>)(\d)(\s*<\/w:t>)/g,
    (m, before, digit, after) => {
      const placeholder = critNums[critCount] || '';
      critCount++;
      ok++;
      return before + digit + ' : ' + placeholder + after;
    }
  );
  if (critCount === 0) console.warn('  ✗ critères (0 found)');

  // Concurrence identifiée (split C + oncurrence)
  rep(/(C)(<\/w:t><\/w:r>[\s\S]*?<w:t[^>]*>)(oncurrence Identifi[eé]e)(<\/w:t>)/,
      '$1$2$3 : {concurrence_identifiee}$4', 'concurrence');

  // Stratégie de réponse / Supervision
  rep(/(Strat[eé]gie de R[eé]ponse)(<\/w:t>)/, '$1 : {strategie_reponse}$2', 'strategie');
  rep(/(Supervision en sous traitance)(<\/w:t>)/, '$1 : {supervision_sous_traitance}$2', 'supervision');

  // Planning dates (non-breaking space before colon)
  rep(new RegExp(`(R[eé]ception DCE${nbsp}: )(<\\/w:t>)`), '$1{planning_reception_dce} $2', 'reception_dce');
  rep(new RegExp(`(COMECO${nbsp}: )(<\\/w:t>)`), '$1{planning_comeco} $2', 'comeco');
  rep(new RegExp(`(Lancement${nbsp}interne${nbsp}: )(<\\/w:t>)`), '$1{planning_lancement_interne} $2', 'lancement');
  // Bouclage — no NBSP, just "Bouclage" then " : " in another run
  rep(/(Bouclage)(<\/w:t>)/, '$1 : {planning_bouclage}$2', 'bouclage');
  rep(new RegExp(`(Remise offre${nbsp}: )(<\\/w:t>)`), '$1{planning_remise_offre} $2', 'remise_offre');

  // Technical sections — append to label
  rep(/(Analyse des Prestations \/ Pr[eé]requis)(<\/w:t>)/, '$1 : {analyse_prestations}$2', 'analyse');
  // Organisation Interne is split: "Organisation Intern" + "e" in separate runs
  rep(/(Organisation Intern)(<\/w:t><\/w:r>[\s\S]*?<w:t[^>]*>)(e)(<\/w:t>)/, '$1$2$3 : {organisation_interne}$4', 'organisation');
  rep(/(Aspects Contractuels)(<\/w:t>)/, '$1 : {aspects_contractuels}$2', 'aspects');
  rep(/(Hypoth[eè]ses de Chiffrage)(<\/w:t>)/, '$1 : {hypotheses_chiffrage}$2', 'hypotheses');
  rep(/(Feuille de Vente)(<\/w:t>)/, '$1 : {feuille_vente}$2', 'feuille_vente');
  rep(/(Al[eé]as)(<\/w:t>)/, '$1 : {aleas}$2', 'aleas');
  // Risques Opérationnels (split R + isques)
  rep(/(R)(<\/w:t><\/w:r>[\s\S]*?<w:t[^>]*>)(isques Op[eé]rationnels)(<\/w:t>)/,
      '$1$2$3 : {risques_operationnels}$4', 'risques_op');
  rep(/(Risques Financiers)(<\/w:t>)/, '$1 : {risques_financiers}$2', 'risques_fin');
  rep(/(Opportunit[eé]s)(<\/w:t>)/, '$1 : {opportunites}$2', 'opportunites');

  // Décisions (NBSP before colon)
  rep(new RegExp(`(Responsable [eé]tude${nbsp}:)(<\\/w:t>)`), '$1 {responsable_etude}$2', 'responsable');
  rep(new RegExp(`(Date remise [eé]tude commerce${nbsp}:)(<\\/w:t>)`), '$1 {date_remise_etude}$2', 'date_remise');

  // ── SDT Checkboxes ─────────────────────────────────────────────────────────
  // Map: text after checkbox SDT → placeholder
  const afterToPlaceholder = {
    ' C1': 'chk_c1', ' C2': 'chk_c2', ' C3': 'chk_c3',
    'Forfait': 'chk_forfait',
    'Bordereau de Prix Unitaires': 'chk_bpu',
    'Bordereau de Prix Forfaitaires': 'chk_bpf',
    'DPGF': 'chk_dpgf', 'DQE': 'chk_dqe_bpu',
    'Liste des PU': 'chk_liste_pu', 'Autres': 'chk_devis',
    'Ferme': 'chk_ferme', 'Actualisable': 'chk_actualisable',
    'visable': 'chk_revisable',
    'Seul': 'chk_seul', 'Cotraitance': 'chk_cotraitance',
    'Sous-traitance': 'chk_sous_traitance',
  };

  let sdtPos = 0;
  const xmlCopy = xml; // snapshot to read "after" text from current positions
  xml = xml.replace(/<w:sdt>([\s\S]*?)<\/w:sdt>/g, (match, inner, offset) => {
    if (!match.includes('<w14:checkbox>')) return match;
    // Look at text after this SDT
    const afterCtx = xmlCopy.substring(offset + match.length, offset + match.length + 250);
    const afterTexts = (afterCtx.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
      .map(t => t.replace(/<[^>]+>/g, '')).join('');
    let placeholder = '☐';
    for (const [label, field] of Object.entries(afterToPlaceholder)) {
      if (afterTexts.includes(label)) { placeholder = `{${field}}`; break; }
    }
    const modified = match.replace(/<w:t>☐<\/w:t>/, `<w:t>${placeholder}</w:t>`);
    if (modified !== match) ok++;
    return modified;
  });

  // ── Atouts / Faiblesses empty value rows (Table 7) ──────────────────────────
  xml = xml.replace(
    /(<w:t>Atouts<\/w:t><\/w:r><\/w:p><\/w:tc><\/w:tr>)([\s\S]*?)(<w:tc[^>]*>[\s\S]*?<w:p[^>]*>)(<w:pPr>[\s\S]*?<\/w:pPr>)(<\/w:p>)/,
    (m, a, b, c, d, e) => { ok++; return a + b + c + d + '<w:r><w:t>{atouts}</w:t></w:r>' + e; }
  );
  xml = xml.replace(
    /(<w:t>Faiblesse<\/w:t><\/w:r><\/w:p><\/w:tc><\/w:tr>)([\s\S]*?)(<w:tc[^>]*>[\s\S]*?<w:p[^>]*>)(<w:pPr>[\s\S]*?<\/w:pPr>)(<\/w:p>)/,
    (m, a, b, c, d, e) => { ok++; return a + b + c + d + '<w:r><w:t>{faiblesses}</w:t></w:r>' + e; }
  );

  // ── Planning Projet (first empty para after label) ───────────────────────────
  xml = xml.replace(
    /(<w:t>Planning Projet<\/w:t><\/w:r><\/w:p>)([\s\S]*?<w:p[^>]*>)(<w:pPr>[\s\S]*?<\/w:pPr>)(<\/w:p>)/,
    (m, a, b, c, d) => { ok++; return a + b + c + '<w:r><w:t>{planning_projet}</w:t></w:r>' + d; }
  );

  // ── Summary ──────────────────────────────────────────────────────────────────
  const placeholders = [...new Set((xml.match(/\{[a-z_]+\}/g) || []))].sort();
  console.log(`\n✅ Placeholders (${placeholders.length}):`);
  placeholders.forEach(p => process.stdout.write('  ' + p));
  console.log(`\n\nReplacements OK: ${ok}, Failed: ${fail}`);

  zip.file('word/document.xml', xml);
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(OUTPUT, buf);
  console.log('✅ Saved:', OUTPUT, '(' + Math.round(buf.length/1024) + ' KB)');
}

main().catch(err => { console.error(err); process.exit(1); });
