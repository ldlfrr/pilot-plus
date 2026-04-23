# PILOT+ — Architecture & Documentation Technique

## Stack

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Composants UI | shadcn/ui + Radix UI |
| Backend | API Routes Next.js (Node.js runtime) |
| Base de données | Supabase (PostgreSQL + RLS) |
| Stockage fichiers | Supabase Storage |
| Authentification | Supabase Auth |
| IA | OpenAI gpt-4o (structured output JSON Schema) |
| Extraction PDF | pdf-parse |
| Extraction DOCX | mammoth |
| Graphiques | Recharts |

---

## Structure des fichiers

```
pilot-plus/
├── app/
│   ├── (auth)/                    # Pages auth (layout sombre)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/               # Pages protégées
│   │   ├── layout.tsx             # Sidebar + vérif auth
│   │   ├── dashboard/page.tsx     # Tableau de bord
│   │   └── projects/
│   │       ├── page.tsx           # Liste projets
│   │       ├── new/page.tsx       # Créer un projet
│   │       └── [id]/
│   │           ├── page.tsx       # Détail projet (client component)
│   │           └── edit/page.tsx  # Modifier projet
│   ├── api/
│   │   ├── projects/route.ts      # GET list / POST create
│   │   ├── projects/[id]/
│   │   │   ├── route.ts           # GET / PUT / DELETE
│   │   │   ├── analyze/route.ts   # POST → appel OpenAI
│   │   │   └── score/route.ts     # POST → appel OpenAI scoring
│   │   ├── files/
│   │   │   ├── upload/route.ts    # POST multipart/form-data
│   │   │   └── [id]/route.ts     # DELETE
│   │   └── dashboard/stats/route.ts
│   ├── auth/callback/route.ts     # OAuth callback Supabase
│   ├── layout.tsx
│   └── page.tsx                   # Redirect → /dashboard ou /login
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx            # Navigation latérale
│   │   └── Header.tsx             # En-tête pages
│   ├── dashboard/
│   │   ├── StatsCard.tsx          # Carte statistique
│   │   └── ActivityChart.tsx      # Graphique Recharts
│   ├── projects/
│   │   ├── ProjectCard.tsx        # Carte projet (lien)
│   │   ├── ProjectForm.tsx        # Formulaire create/edit
│   │   └── FileUpload.tsx         # Drag & drop upload
│   └── analysis/
│       ├── AnalysisDisplay.tsx    # Rendu synthèse IA
│       ├── ScoreDisplay.tsx       # Rendu score Go/No Go
│       └── AnalysisHistory.tsx    # Historique analyses
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   └── server.ts              # Server client + service client
│   ├── openai/
│   │   ├── client.ts              # Instance OpenAI
│   │   └── prompts.ts             # System prompts + JSON schemas
│   └── utils/
│       ├── extract.ts             # Extraction PDF/DOCX
│       └── cn.ts                  # clsx + tailwind-merge
├── types/index.ts                 # Types TypeScript centralisés
├── middleware.ts                  # Auth middleware (protection routes)
└── supabase/migrations/
    └── 001_initial_schema.sql     # Schéma BDD complet
```

---

## Schéma base de données

```
auth.users (Supabase natif)
    │
    ├── profiles (1:1)
    │     id, full_name, company, avatar_url
    │
    └── projects (1:N)
          id, user_id, name, client, consultation_type,
          location, offer_deadline, status
          │
          ├── project_files (1:N)
          │     id, project_id, filename, storage_path,
          │     file_type, file_size, extracted_text, extraction_status
          │
          ├── project_analyses (1:N)
          │     id, project_id, version, result (JSONB),
          │     prompt_version, model_used, tokens_used
          │
          └── project_scores (1:N)
                id, project_id, analysis_id,
                score_details (JSONB), total_score, verdict
```

**RLS activé sur toutes les tables** — chaque utilisateur ne voit que ses propres données.

---

## Flux complet d'une analyse

```
1. Utilisateur crée un projet (POST /api/projects)
         ↓
2. Upload DCE (POST /api/files/upload)
   → stockage Supabase Storage (dce-files/{userId}/{projectId}/*.pdf)
   → extraction texte synchrone (pdf-parse / mammoth)
   → stockage extracted_text en DB
         ↓
3. Lancer l'analyse IA (POST /api/projects/{id}/analyze)
   → récupère les extracted_text des fichiers (status=done)
   → construit le prompt avec ANALYSIS_SYSTEM_PROMPT
   → appel OpenAI gpt-4o avec response_format JSON Schema strict
   → parse la réponse JSON
   → sauvegarde dans project_analyses (version++)
   → met à jour project.status = 'analyzed'
         ↓
4. Lancer le scoring (POST /api/projects/{id}/score)
   → récupère la dernière analyse
   → construit le prompt de scoring
   → appel OpenAI gpt-4o avec JSON Schema strict
   → vérifie/corrige le verdict (règle 80/50/0)
   → sauvegarde dans project_scores
   → met à jour project.status = 'scored'
         ↓
5. Affichage page projet
   → AnalysisDisplay (synthèse structurée)
   → ScoreDisplay (barres de critères + verdict coloré)
   → AnalysisHistory (versions précédentes)
```

---

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=          # URL du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Clé publique Supabase
SUPABASE_SERVICE_ROLE_KEY=         # Clé service (backend uniquement)
OPENAI_API_KEY=                    # Clé API OpenAI
NEXT_PUBLIC_APP_URL=               # URL de l'application
```

---

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et renseigner les variables d'environnement
cp .env.local.example .env.local

# 3. Initialiser la base de données
# Copier le contenu de supabase/migrations/001_initial_schema.sql
# et l'exécuter dans Supabase SQL Editor

# 4. Installer les composants shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input label select tabs badge progress toast separator

# 5. Lancer en développement
npm run dev
```

---

## Scoring Go/No Go

| Critère | Poids | Description |
|---------|-------|-------------|
| Rentabilité | /20 | Potentiel de marge, taille projet, contraintes financières |
| Complexité | /20 | Score inversé — plus complexe = score plus bas |
| Alignement capacité | /20 | Adéquation avec notre cœur de métier |
| Probabilité de gain | /20 | Estimation des chances de remporter le marché |
| Charge interne | /20 | Score inversé — plus la charge est lourde = plus bas |

| Score total | Verdict |
|------------|---------|
| ≥ 80 | 🟢 GO |
| 50 à 79 | 🟡 À ÉTUDIER |
| < 50 | 🔴 NO GO |
