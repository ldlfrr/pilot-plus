import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}
const FROM = process.env.EMAIL_FROM ?? 'PILOT+ <noreply@pilot-plus.fr>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pilot-plus.fr'

// ── Deadline alert ────────────────────────────────────────────────────────────

export async function sendDeadlineAlert(opts: {
  to: string
  projectName: string
  client: string
  daysLeft: number
  deadline: string
  projectUrl: string
}) {
  const urgency = opts.daysLeft <= 3 ? '🔴 URGENT' : '🟡 Rappel'
  const subject = `${urgency} — ${opts.projectName} : ${opts.daysLeft}j avant échéance`

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080e22;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080e22;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1224;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a2d5a,#0d1224);padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px">PILOT<span style="color:#60a5fa">+</span></p>
          <p style="margin:4px 0 0;font-size:10px;color:rgba(96,165,250,0.5);letter-spacing:3px;text-transform:uppercase">Copilot IA · Analyse DCE</p>
        </td></tr>
        <!-- Alert badge -->
        <tr><td style="padding:28px 32px 0">
          <div style="display:inline-flex;align-items:center;gap:8px;background:${opts.daysLeft <= 3 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'};border:1px solid ${opts.daysLeft <= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'};border-radius:50px;padding:6px 14px">
            <span style="font-size:12px;font-weight:700;color:${opts.daysLeft <= 3 ? '#f87171' : '#fbbf24'}">${opts.daysLeft <= 3 ? '⚠️ Échéance critique' : '🕐 Rappel d\'échéance'}</span>
          </div>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:20px 32px">
          <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#fff">${opts.projectName}</h2>
          <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.4)">${opts.client}</p>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px">Date limite</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#fff">${opts.deadline}</p>
            </div>
            <div style="text-align:right">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px">Jours restants</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:${opts.daysLeft <= 3 ? '#f87171' : '#fbbf24'}">${opts.daysLeft}</p>
            </div>
          </div>
          <div style="margin-top:20px;text-align:center">
            <a href="${opts.projectUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.2px">
              Voir le projet →
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05)">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center">
            Gérer vos préférences de notification dans <a href="${SITE}/account" style="color:rgba(96,165,250,0.6);text-decoration:none">Mon compte</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return getResend().emails.send({ from: FROM, to: opts.to, subject, html })
}

// ── Weekly summary ────────────────────────────────────────────────────────────

export async function sendWeeklySummary(opts: {
  to: string
  userName: string
  totalProjects: number
  pendingProjects: number
  upcomingDeadlines: { name: string; daysLeft: number }[]
  goCount: number
  noGoCount: number
}) {
  const subject = `📊 Résumé hebdomadaire PILOT+ — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`

  const deadlineRows = opts.upcomingDeadlines.slice(0, 5).map(d =>
    `<tr>
      <td style="padding:8px 12px;font-size:13px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.05)">${d.name}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:700;color:${d.daysLeft <= 3 ? '#f87171' : '#fbbf24'};text-align:right;border-bottom:1px solid rgba(255,255,255,0.05)">J-${d.daysLeft}</td>
    </tr>`
  ).join('')

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#080e22;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080e22;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1224;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#1a2d5a,#0d1224);padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="margin:0;font-size:20px;font-weight:900;color:#fff">PILOT<span style="color:#60a5fa">+</span></p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5)">Bonjour ${opts.userName} — voici votre résumé de la semaine</p>
        </td></tr>
        <tr><td style="padding:28px 32px">
          <!-- KPIs -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr>
              ${[
                { label: 'Projets totaux', value: opts.totalProjects, color: '#60a5fa' },
                { label: 'En cours', value: opts.pendingProjects, color: '#a78bfa' },
                { label: 'GO', value: opts.goCount, color: '#34d399' },
                { label: 'NO GO', value: opts.noGoCount, color: '#f87171' },
              ].map(k => `
              <td width="25%" style="text-align:center;padding:16px 8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin:4px">
                <p style="margin:0;font-size:22px;font-weight:900;color:${k.color}">${k.value}</p>
                <p style="margin:4px 0 0;font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px">${k.label}</p>
              </td>`).join('')}
            </tr>
          </table>
          <!-- Deadlines -->
          ${opts.upcomingDeadlines.length > 0 ? `
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1.5px">Échéances à venir</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;margin-bottom:24px">
            ${deadlineRows}
          </table>` : ''}
          <div style="text-align:center">
            <a href="${SITE}/projects" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700">
              Voir mes projets →
            </a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05)">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center">
            <a href="${SITE}/account" style="color:rgba(96,165,250,0.5);text-decoration:none">Se désabonner du résumé hebdomadaire</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return getResend().emails.send({ from: FROM, to: opts.to, subject, html })
}

// ── BOAMP new match ───────────────────────────────────────────────────────────

export async function sendBoampAlert(opts: {
  to: string
  matchCount: number
  matches: { title: string; location: string; deadline: string }[]
}) {
  const subject = `🔎 ${opts.matchCount} nouvelle${opts.matchCount > 1 ? 's' : ''} annonce${opts.matchCount > 1 ? 's' : ''} BOAMP correspondant à vos critères`

  const rows = opts.matches.slice(0, 5).map(m =>
    `<tr>
      <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05)">
        <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.8)">${m.title}</p>
        <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.35)">${m.location} · Limite : ${m.deadline}</p>
      </td>
    </tr>`
  ).join('')

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#080e22;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080e22;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1224;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#1a2d5a,#0d1224);padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="margin:0;font-size:20px;font-weight:900;color:#fff">PILOT<span style="color:#60a5fa">+</span></p>
          <div style="margin-top:10px;display:inline-flex;align-items:center;gap:8px;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:50px;padding:6px 14px">
            <span style="font-size:12px;font-weight:700;color:#60a5fa">📡 ${opts.matchCount} nouveau${opts.matchCount > 1 ? 'x' : ''} résultat${opts.matchCount > 1 ? 's' : ''} BOAMP</span>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.5)">Des appels d'offres correspondant à votre profil ont été détectés :</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;margin-bottom:24px">
            ${rows}
          </table>
          <div style="text-align:center">
            <a href="${SITE}/veille" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700">
              Voir la veille BOAMP →
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return getResend().emails.send({ from: FROM, to: opts.to, subject, html })
}
