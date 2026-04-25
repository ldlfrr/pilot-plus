/**
 * Email sending via Resend.
 * Falls back to console.log if RESEND_API_KEY is not configured.
 */

// ─── Deadline alert (used by cron/deadlines) ──────────────────────────────────

export async function sendDeadlineAlert(opts: {
  to:          string
  projectName: string
  client:      string
  daysLeft:    number
  deadline:    string
  projectUrl:  string
}) {
  const urgency   = opts.daysLeft <= 2 ? '🔴' : opts.daysLeft <= 7 ? '🟡' : '🔵'
  const subject   = `${urgency} Échéance J-${opts.daysLeft} — ${opts.projectName}`
  const html = `<!DOCTYPE html><html><body style="background:#0a0f1e;font-family:system-ui;padding:40px 20px;color:#fff;">
<div style="max-width:520px;margin:0 auto;background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:32px;">
<h2 style="margin:0 0 8px;font-size:20px;">${urgency} Rappel d'échéance</h2>
<p style="color:rgba(255,255,255,0.6);margin:0 0 20px;">Votre projet arrive à échéance dans <strong style="color:#fff;">J-${opts.daysLeft}</strong>.</p>
<div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:16px;margin-bottom:24px;">
<p style="margin:0 0 4px;font-size:18px;font-weight:700;">${opts.projectName}</p>
<p style="margin:0;color:rgba(255,255,255,0.5);font-size:14px;">${opts.client} · ${opts.deadline}</p>
</div>
<a href="${opts.projectUrl}" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;">Voir le projet →</a>
</div></body></html>`
  await sendEmail({ to: opts.to, subject, html })
}

// ─── Weekly summary (used by cron/weekly) ─────────────────────────────────────

export async function sendWeeklySummary(opts: {
  to:               string
  userName:         string
  totalProjects:    number
  pendingProjects:  number
  upcomingDeadlines: Array<{ name: string; client?: string; daysLeft: number }>
  goCount?:   number
  noGoCount?: number
}) {
  const subject = `📊 Votre récap PILOT+ de la semaine`
  const deadlinesHtml = opts.upcomingDeadlines.length > 0
    ? opts.upcomingDeadlines.map(d =>
        `<li style="padding:4px 0;color:rgba(255,255,255,0.7);">${d.name}${d.client ? ` <span style="color:rgba(255,255,255,0.4);">(${d.client})</span>` : ''} — J-${d.daysLeft}</li>`
      ).join('')
    : '<li style="color:rgba(255,255,255,0.35);">Aucune échéance proche</li>'

  const html = `<!DOCTYPE html><html><body style="background:#0a0f1e;font-family:system-ui;padding:40px 20px;color:#fff;">
<div style="max-width:520px;margin:0 auto;background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:32px;">
<h2 style="margin:0 0 8px;">Bonjour ${opts.userName} 👋</h2>
<p style="color:rgba(255,255,255,0.5);margin:0 0 24px;">Voici votre résumé hebdomadaire PILOT+.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:16px;text-align:center;">
<p style="font-size:28px;font-weight:800;margin:0;">${opts.totalProjects}</p>
<p style="font-size:12px;color:rgba(255,255,255,0.4);margin:4px 0 0;">Projets total</p>
</div>
<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;text-align:center;">
<p style="font-size:28px;font-weight:800;margin:0;">${opts.pendingProjects}</p>
<p style="font-size:12px;color:rgba(255,255,255,0.4);margin:4px 0 0;">En cours</p>
</div></div>
<h3 style="font-size:14px;margin:0 0 12px;color:rgba(255,255,255,0.6);">Prochaines échéances</h3>
<ul style="margin:0 0 24px;padding-left:16px;">${deadlinesHtml}</ul>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;">Voir mes projets →</a>
</div></body></html>`
  await sendEmail({ to: opts.to, subject, html })
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL     = process.env.EMAIL_FROM ?? 'PILOT+ <noreply@pilotplus.fr>'
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export interface SendEmailOptions {
  to:      string
  subject: string
  html:    string
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log('[email] RESEND_API_KEY not set — skipping send')
    console.log(`[email] To: ${opts.to}`)
    console.log(`[email] Subject: ${opts.subject}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function projectInvitationEmail({
  inviterName,
  projectName,
  role,
  token,
  isNewUser,
}: {
  inviterName: string
  projectName: string
  role: string
  token: string
  isNewUser: boolean
}) {
  const link = isNewUser
    ? `${APP_URL}/signup?invite=${token}`
    : `${APP_URL}/invite/${token}`

  const roleLabel: Record<string, string> = {
    editor: 'Éditeur (peut modifier)',
    viewer: 'Lecteur (consultation uniquement)',
    avant_vente: 'Avant-Vente (chiffrage + mémoire)',
  }

  const subject = `${inviterName} vous invite sur le projet « ${projectName} »`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">PILOT<span style="color:#60a5fa;">+</span></div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-top:4px;">DÉCIDEZ · EXÉCUTEZ · GAGNEZ</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#fff;">Invitation au projet</h1>
            <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6;">
              <strong style="color:rgba(255,255,255,0.8);">${inviterName}</strong> vous invite à collaborer sur un projet dans PILOT+.
            </p>
            <!-- Project card -->
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:20px;margin-bottom:28px;">
              <div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Projet</div>
              <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;">${projectName}</div>
              <div style="display:inline-block;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.30);color:#93c5fd;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">
                ${roleLabel[role] ?? role}
              </div>
            </div>
            <!-- CTA -->
            <a href="${link}" style="display:block;text-align:center;background:#2563eb;color:#fff;font-size:15px;font-weight:700;padding:16px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
              ${isNewUser ? 'Créer mon compte et rejoindre →' : 'Voir l\'invitation →'}
            </a>
            ${isNewUser ? `<p style="margin:16px 0 0;text-align:center;font-size:12px;color:rgba(255,255,255,0.25);">Vous n'avez pas encore de compte PILOT+.<br>Cliquez pour en créer un — votre accès au projet sera automatique.</p>` : ''}
            <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.20);text-align:center;">
              Ce lien expire dans 7 jours. Si vous avez reçu ce message par erreur, ignorez-le.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}

export function teamInvitationEmail({
  inviterName,
  teamName,
  role,
  token,
  isNewUser,
}: {
  inviterName: string
  teamName: string
  role: string
  token: string
  isNewUser: boolean
}) {
  const link = isNewUser
    ? `${APP_URL}/signup?invite=${token}`
    : `${APP_URL}/invite/${token}`

  const subject = `${inviterName} vous invite dans l'équipe « ${teamName} »`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">PILOT<span style="color:#60a5fa;">+</span></div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-top:4px;">DÉCIDEZ · EXÉCUTEZ · GAGNEZ</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#fff;">Invitation à rejoindre une équipe</h1>
            <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6;">
              <strong style="color:rgba(255,255,255,0.8);">${inviterName}</strong> vous invite à rejoindre son équipe sur PILOT+.
            </p>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:20px;margin-bottom:28px;">
              <div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Équipe</div>
              <div style="font-size:18px;font-weight:700;color:#fff;">${teamName}</div>
            </div>
            <a href="${link}" style="display:block;text-align:center;background:#2563eb;color:#fff;font-size:15px;font-weight:700;padding:16px 32px;border-radius:10px;text-decoration:none;">
              ${isNewUser ? 'Créer mon compte et rejoindre →' : 'Voir l\'invitation →'}
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.20);text-align:center;">Ce lien expire dans 7 jours.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}
