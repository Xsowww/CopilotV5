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
├── data/
│   └── mockData.ts
├── hooks/
│   └── useAutoRefresh.ts
├── layouts/
│   └── DashboardLayout.tsx
├── pages/
│   ├── Dashboard/
│   │   └── DashboardPage.tsx
│   ├── Drive/
│   │   └── DrivePage.tsx
│   ├── Notes/
│   │   └── NotesPage.tsx
│   └── Organisation/
│       └── OrganisationPage.tsx
├── services/
│   ├── mockApi.ts
│   └── supabaseClient.ts
├── types/
│   └── index.ts
├── utils/
│   └── formatters.ts
├── App.tsx
├── index.css
└── main.tsx
```

Chaque espace fonctionne de manière indépendante, avec ses composants dédiés et des endpoints mock simulés via `mockApi`. L'intégration à Supabase est préparée dans `supabaseClient.ts` : il suffit de définir les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` pour basculer vers une base temps réel.

## Fonctionnalités

- **Dashboard** : widgets dynamiques affichant les dernières activités Drive, Notes, Organisation et une synthèse transversale.
- **Drive** : table d'exploration calquée sur iCloud Drive (actions rapides, métadonnées, statut de partage).
- **Organisation** : vision consolidée du calendrier, des tâches (priorités, statuts) et des rappels.
- **Notes** : navigation par dossiers et lecture riche des notes.
- **Chatbot Copilot** : cadran fixe inspiré des assistants iCloud, connecté à l'API mock pour simuler les commandes vocales/textuelles.

## Lancer le projet

```bash
npm install
npm run dev
```

L'application est disponible sur [http://localhost:5173](http://localhost:5173) et l'interface est entièrement en français.

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
