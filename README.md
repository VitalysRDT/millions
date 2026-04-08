# Millions

Site web premium avec deux jeux multi-joueurs en temps réel :

1. **Qui veut gagner des millions** — battle royale parallèle 2-8 joueurs.
2. **Bataille navale à questions** — duel 1v1, chaque tir débloqué par une bonne réponse.

Stack : **Next.js 15 (App Router) + Vercel + Neon Postgres + Upstash Redis**, auth pseudo+cookie HMAC, polling 1 s.

## Setup local

```bash
# 1. Installer les dépendances
pnpm install

# 2. Variables d'environnement
cp .env.example .env
# → renseigner DATABASE_URL (Neon), UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, SESSION_SECRET (32+ chars)

# 3. Créer les tables et seeder les questions
pnpm db:push                       # crée tout le schéma via Drizzle
pnpm db:seed                       # importe les 12 031 questions FR depuis questions.json

# 4. Lancer le dev server
pnpm dev
```

Ouvre [http://localhost:3000](http://localhost:3000), choisis un pseudo, crée un lobby et partage le code.

## Architecture clé

- **État canonique en Redis** : `lobby:{code}` = JSON unique avec compteur de version. Le polling client (`/api/lobbies/[code]/state`) lit Redis sans toucher Postgres.
- **Anti-cheat** : la bonne réponse n'est jamais envoyée au client. Elle est stockée dans une clé Redis privée `game:{id}:q:{round}:correct` et comparée côté serveur.
- **Mutations atomiques** : `applyLobbyMutation(code, mutator)` prend un lock Redis SETNX, applique la mutation, incrémente la version, libère.
- **Idempotence** : chaque action (réponse, tir) envoie un `clientIdemKey` (nanoid) → SETNX Redis empêche les doubles soumissions.
- **Timer serveur** : la deadline est un timestamp absolu dans le state. Toute action vérifie `Date.now() <= deadlineAt + 500ms`. Un endpoint `/tick` est appelé périodiquement pour résoudre les rounds expirés sans cron.

## Déploiement Vercel

1. Push le repo sur GitHub.
2. Connecte le projet à Vercel.
3. Variables d'environnement à configurer dans le dashboard Vercel :
   - `DATABASE_URL` (Neon — utiliser la connection string pooled)
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `SESSION_SECRET` (32+ caractères, générer avec `openssl rand -hex 32`)
4. Build command : `pnpm build` (auto-détecté).
5. Avant le premier déploiement, lance `pnpm db:push` puis `pnpm db:seed` localement contre la même base Neon.

## Scripts utiles

- `pnpm dev` — serveur de dev
- `pnpm build` — build production
- `pnpm lint` — eslint
- `pnpm typecheck` — tsc --noEmit
- `pnpm db:push` — applique le schéma Drizzle à Postgres
- `pnpm db:seed` — seed les questions
