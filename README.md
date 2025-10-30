# Copilot — Tableau de bord étudiant

Copilot est une application web pensée comme un couteau suisse numérique pour les étudiants. Elle regroupe un tableau de bord dynamique, un espace Drive, un espace Organisation, un espace Notes ainsi qu'un chatbot contextuel capable d'interagir avec toutes les fonctionnalités.

Le design reprend fidèlement l'esthétique d'iCloud : dégradés profonds, cartes vitrées et typographie soignée pour offrir une interface moderne, simple et accessible.

## Aperçu de l'architecture

```
src/
├── components/
│   ├── chatbot/
│   │   └── CopilotChatbot.tsx
│   ├── common/
│   │   └── WidgetCard.tsx
│   ├── navigation/
│   │   ├── AppSidebar.tsx
│   │   └── TopBar.tsx
│   └── widgets/
│       ├── ActivityWidget.tsx
│       ├── DriveWidget.tsx
│       ├── NotesWidget.tsx
│       └── OrganisationWidget.tsx
├── context/
│   ├── AppDataContext.tsx
│   └── AuthContext.tsx
├── hooks/
│   └── useAutoRefresh.ts
├── layouts/
│   └── DashboardLayout.tsx
├── pages/
│   ├── Auth/
│   │   └── AuthPage.tsx
│   ├── Dashboard/
│   │   └── DashboardPage.tsx
│   ├── Drive/
│   │   └── DrivePage.tsx
│   ├── Notes/
│   │   └── NotesPage.tsx
│   └── Organisation/
│       └── OrganisationPage.tsx
├── services/
│   ├── mistralClient.ts
│   └── supabaseClient.ts
├── types/
│   └── index.ts
├── utils/
│   └── formatters.ts
├── App.tsx
├── index.css
└── main.tsx
```

Chaque espace fonctionne de manière indépendante, avec des composants dédiés. Toutes les données métiers (drive, notes, organisation, profil, mise en page, messages du chatbot) sont sérialisées par utilisateur et stockées dans Supabase via `AppDataContext`. Le chatbot s'appuie désormais sur le client `mistralClient` pour déléguer les requêtes à l'API officielle de Mistral.

## Fonctionnalités

- **Dashboard** : widgets dynamiques affichant les dernières activités Drive, Notes, Organisation et une synthèse transversale.
- **Drive** : table d'exploration calquée sur iCloud Drive (actions rapides, métadonnées, statut de partage).
- **Organisation** : vision consolidée du calendrier, des tâches (priorités, statuts) et des rappels.
- **Notes** : navigation par dossiers et lecture riche des notes.
- **Chatbot Copilot** : cadran fixe inspiré des assistants iCloud, connecté directement à l'agent Mistral privé configuré pour Copilot.
- **Authentification** : écran d'inscription/connexion e-mail + mot de passe (Supabase Auth) avec redirection automatique vers le tableau de bord une fois connecté.
- **Persistance Supabase** : chaque modification est synchronisée en temps réel dans la table `app_state` pour l'utilisateur connecté et rechargée à la connexion, sans recours au stockage local.

## Lancer le projet

```bash
npm install
npm run dev
```

L'application est disponible sur [http://localhost:5173](http://localhost:5173) et l'interface est entièrement en français.

## Configuration Supabase

1. **Créer un projet Supabase** et récupérer l'URL ainsi que la clé anonyme (onglet _Settings → API_).
2. **Définir les variables d'environnement** dans un fichier `.env` en se basant sur `.env.example` :

   ```bash
   VITE_SUPABASE_URL="https://<votre-instance>.supabase.co"
   VITE_SUPABASE_ANON_KEY="<clé-anon>"
   VITE_SUPABASE_STORAGE_BUCKET="Copilot" # optionnel mais conseillé
   VITE_MISTRAL_API_KEY="<clé-api-mistral>"
   VITE_MISTRAL_AGENT_ID="<identifiant-agent-mistral>"
   ```

3. **Créer la table de persistance** en exécutant le SQL ci-dessous dans l'onglet _SQL Editor_ :

   ```sql
   create table if not exists app_state (
     user_id uuid primary key references auth.users on delete cascade,
     drive jsonb default '{}'::jsonb,
     notes jsonb default '{}'::jsonb,
     organisation jsonb default '{}'::jsonb,
     activities jsonb default '[]'::jsonb,
     widget_layout jsonb default '{}'::jsonb,
     profile jsonb default '{}'::jsonb,
     chat jsonb default '[]'::jsonb,
     notifications jsonb default '[]'::jsonb,
     updated_at timestamptz default now()
   );

   alter table app_state enable row level security;

   create policy "Utilisation lecture" on app_state
     for select using (auth.uid() = user_id);

   create policy "Utilisation écriture" on app_state
     for insert with check (auth.uid() = user_id);

   create policy "Utilisation mise à jour" on app_state
     for update using (auth.uid() = user_id);

   -- Si la table existait déjà sans colonne `notifications`, exécutez également :
   alter table app_state
     add column if not exists notifications jsonb default '[]'::jsonb;
   ```

4. **(Optionnel) Créer un bucket de stockage** si vous souhaitez externaliser les fichiers importés :

   ```sql
   select storage.create_bucket('Copilot', true, 'public');
   ```

   Ensuite, indiquez le nom du bucket dans `VITE_SUPABASE_STORAGE_BUCKET`. À défaut, les fichiers sont sérialisés en base64 dans `app_state` pour conserver la prévisualisation.

5. **Configurer l'agent Mistral** : créez (ou réutilisez) un agent privé dans la console Mistral, notez son identifiant (`ag_...`) puis collez-le dans `VITE_MISTRAL_AGENT_ID`. Le chatbot enverra toutes les requêtes à cet agent, qui peut lui-même orchestrer des outils ou workflows personnalisés.

### Checklist détaillée pour l'intégration Mistral

Pour que je puisse brancher l'agent Mistral et que l'utilisateur puisse dialoguer avec lui sans erreur, merci de préparer l'ensemble des éléments ci-dessous :

1. **Accès Mistral**
   - Un compte Mistral actif avec accès à l'API privée (`@mistralai/mistralai-private`).
   - L'API doit être autorisée à appeler l'endpoint `https://api.mistral.ai/` depuis votre environnement (pare-feu/Proxy/allow-list si nécessaire).

2. **Agent configuré**
   - Un agent conversationnel créé dans la console Mistral (onglet *Agents*).
   - L'identifiant exact de l'agent (`ag_xxx…`) tel qu'affiché dans la console.
   - Les outils éventuels que l'agent peut invoquer (fonctions, webhooks) doivent être opérationnels côté serveur.

3. **Clé API**
   - Une clé API Mistral privée avec les droits d'invocation de l'agent.
   - Cette clé doit être renseignée dans `VITE_MISTRAL_API_KEY` dans le fichier `.env` (et éventuellement dans votre solution de déploiement). Vérifiez qu'elle n'est pas expirée et qu'elle n'est pas limitée par l'IP de l'environnement de développement.

4. **Variables d'environnement**
   - `VITE_MISTRAL_API_KEY` : la clé API mentionnée ci-dessus.
   - `VITE_MISTRAL_AGENT_ID` : l'identifiant `ag_…` de l'agent.
   - (Optionnel) `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_STORAGE_BUCKET` déjà configurés pour la persistance.
   - Assurez-vous que le fichier `.env` est chargé avant de lancer `npm run dev` (redémarrer Vite après modification).

5. **Autorisations côté navigateur**
   - Vérifiez que votre navigateur accepte les requêtes sortantes vers `https://api.mistral.ai` (pas de bloqueur de requêtes/API, pas de VPN bloquant l'hôte).
   - Si vous utilisez une configuration proxy d'entreprise, indiquez les paramètres nécessaires pour que les requêtes fetch atteignent Mistral.

6. **Tests de connexion**
   - Depuis votre machine, exécutez un test rapide (ex. `curl https://api.mistral.ai/v1/health` avec le header `Authorization: Bearer <clé>`). Une réponse `200` confirme l'accessibilité du service.
   - Vérifiez également que l'identifiant d'agent est correct en lançant un script de test similaire à l'extrait TypeScript fourni dans le README.

7. **Sécurité & distribution**
   - Si vous déployez Copilot en production, stockez les variables dans un gestionnaire de secrets (Supabase, Vercel, Netlify, etc.) pour éviter de commiter les clés dans Git.
   - Regénérez la clé Mistral si elle a été exposée publiquement.

Une fois ces prérequis validés, le chatbot Copilot se connecte automatiquement à l'agent Mistral à chaque ouverture de session et conserve l'identifiant de conversation tant que l'onglet reste ouvert.

6. **Redémarrer le serveur de développement** (`npm run dev`). À la première connexion, une entrée vide est créée automatiquement dans `app_state` et les espaces Drive/Notes/Organisation apparaissent vides, prêts à être alimentés par l'utilisateur.

## Tests et qualité

- `npm run lint` : s'assure de la conformité TypeScript/ESLint.
- `npm run build` : valide la compilation de l'application.

## Technologies principales

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [React Router](https://reactrouter.com/) pour la navigation
- [date-fns](https://date-fns.org/) pour les formats de dates en français
- [Supabase JS](https://supabase.com/docs/reference/javascript/installing) (prêt à l'emploi)
- [React Icons](https://react-icons.github.io/react-icons/) pour les pictogrammes cohérents avec l'univers Apple

## Personnalisation du design

Les variables CSS en haut de `index.css` permettent d'ajuster facilement le dégradé de fond, les couleurs d'accent et les rayons de bordure si vous souhaitez décliner le thème.

## Licence

Projet réalisé pour démontrer une architecture front-end inspirée d'iCloud. Aucune donnée réelle n'est utilisée.
