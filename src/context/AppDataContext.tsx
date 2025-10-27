/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../services/supabaseClient";
import type {
  ChatMessage,
  ClipboardState,
  DriveFileNode,
  DriveFolderNode,
  DriveNode,
  Evenement,
  Note,
  NoteFolder,
  Rappel,
  SystemNotification,
  Tache,
  UserProfile,
  WidgetActivity,
  WidgetLayout,
} from "../types";

interface DriveState {
  rootId: string;
  nodes: Record<string, DriveNode>;
}

const DRIVE_ROOT_ID = "drive-racine";
const NOTES_ROOT_ID = "notes-racine";

const createDefaultDriveState = (): DriveState => ({
  rootId: DRIVE_ROOT_ID,
  nodes: {
    [DRIVE_ROOT_ID]: {
      id: DRIVE_ROOT_ID,
      nom: "Mon Drive",
      type: "dossier",
      parentId: null,
      enfants: [],
      partage: false,
      misAJourLe: new Date().toISOString(),
    },
  },
});

const createDefaultNotesState = (): NotesState => ({
  folders: {
    [NOTES_ROOT_ID]: {
      id: NOTES_ROOT_ID,
      nom: "Notes",
      parentId: null,
      enfants: [],
    },
  },
  notes: {},
});

const createDefaultOrganisationState = (): OrganisationState => ({
  evenements: [],
  taches: [],
  rappels: [],
});

const normalizeOrganisationState = (state: OrganisationState): OrganisationState => ({
  ...state,
  evenements: state.evenements.map((evenement) => ({
    ...evenement,
    priorite: evenement.priorite ?? "normale",
    urgent: evenement.urgent ?? false,
  })),
});

const defaultMessages: ChatMessage[] = [];

const createDefaultProfile = (user: User): UserProfile => ({
  id: user.id,
  nom:
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.length > 0
      ? (user.user_metadata.full_name as string)
      : undefined) ?? user.email?.split("@")[0] ?? "Profil",
  email: user.email ?? "",
  avatarUrl:
    (typeof user.user_metadata?.avatar_url === "string"
      ? (user.user_metadata.avatar_url as string)
      : ""),
  // Ajout : notifications activées par défaut tant que l'utilisateur ne modifie pas la préférence dans son profil.
  notificationsActives: true,
  modeConcentration: false,
  partageActivite: true,
});

interface NotesState {
  folders: Record<string, NoteFolder>;
  notes: Record<string, Note>;
}

interface OrganisationState {
  evenements: Evenement[];
  taches: Tache[];
  rappels: Rappel[];
}

interface AppDataContextValue {
  drive: DriveState;
  notes: NotesState;
  organisation: OrganisationState;
  activities: WidgetActivity[];
  widgetLayout: WidgetLayout;
  clipboard: ClipboardState;
  chatMessages: ChatMessage[];
  profile: UserProfile;
  notifications: SystemNotification[];
  now: number;
  isHydrated: boolean;
  isSyncing: boolean;
  refreshFromSupabase: () => Promise<void>;
  createDriveFolder: (parentId: string, nom: string) => void;
  uploadDriveFiles: (parentId: string, files: File[]) => void;
  renameDriveNode: (nodeId: string, nom: string) => void;
  deleteDriveNode: (nodeId: string) => void;
  moveDriveNode: (nodeId: string, targetFolderId: string) => void;
  copyDriveNode: (nodeId: string) => void;
  cutDriveNode: (nodeId: string) => void;
  pasteClipboard: (targetFolderId: string) => void;
  updateDriveFile: (nodeId: string, updates: Partial<DriveFileNode>) => void;
  clearClipboard: () => void;
  createNoteFolder: (parentId: string, nom: string) => string;
  renameNoteFolder: (folderId: string, nom: string) => void;
  deleteNoteFolder: (folderId: string) => void;
  createNote: (payload: { dossierId: string; titre?: string }) => string;
  updateNote: (noteId: string, contenu: string, titre?: string) => void;
  deleteNote: (noteId: string) => void;
  moveNote: (noteId: string, dossierId: string) => void;
  saveWidgetLayout: (layout: WidgetLayout) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addActivity: (activity: Omit<WidgetActivity, "id" | "date"> & { type: WidgetActivity["type"] }) => void;
  addChatMessage: (message: ChatMessage) => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
  addNotification: (notification: { titre: string; message: string; niveau?: SystemNotification["niveau"] }) => void;
  markNotificationsAsRead: (ids?: string[]) => void;
  saveEvenement: (evenement: Evenement) => void;
  deleteEvenement: (evenementId: string) => void;
  saveTache: (tache: Tache) => void;
  deleteTache: (tacheId: string) => void;
  saveRappel: (rappel: Rappel) => void;
  deleteRappel: (rappelId: string) => void;
}

const defaultLayout: WidgetLayout = {
  colonneGauche: ["drive", "notes"],
  colonneDroite: ["organisation", "activite"],
};

const initialClipboard: ClipboardState = {
  elementId: null,
  mode: null,
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  drive: "copilot-drive",
  notes: "copilot-notes",
  organisation: "copilot-organisation",
  layout: "copilot-widget-layout",
  profile: "copilot-profile",
  chat: "copilot-chat",
  activities: "copilot-activities",
  notifications: "copilot-notifications",
};

const isBrowser = typeof window !== "undefined";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "json", "csv"]);
const DOCUMENT_EXTENSIONS = new Set(["doc", "docx", "rtf"]);

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const readFileAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const readStorage = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      return (Array.isArray(parsed) ? parsed : fallback) as T;
    }
    return { ...fallback, ...parsed };
  } catch (error) {
    console.warn("Impossible de lire le stockage local", error);
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const cloneDriveSubtree = (nodes: Record<string, DriveNode>, nodeId: string, parentId: string | null) => {
  const node = nodes[nodeId];
  if (!node) return { nodes: {}, rootId: null as string | null };

  const newId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  if (node.type === "fichier") {
    const fileClone: DriveFileNode = {
      ...node,
      id: newId,
      parentId,
      misAJourLe: nowIso,
    };
    return { nodes: { [newId]: fileClone }, rootId: newId };
  }

  const folderClone: DriveFolderNode = {
    ...node,
    id: newId,
    parentId,
    enfants: [],
    misAJourLe: nowIso,
  };

  let clonedNodes: Record<string, DriveNode> = { [newId]: folderClone };
  node.enfants.forEach((childId) => {
    const childClone = cloneDriveSubtree(nodes, childId, newId);
    if (childClone.rootId) {
      (clonedNodes[newId] as DriveFolderNode).enfants.push(childClone.rootId);
    }
    clonedNodes = { ...clonedNodes, ...childClone.nodes };
  });

  return { nodes: clonedNodes, rootId: newId };
};

interface AppDataProviderProps extends PropsWithChildren {
  user: User;
}

export const AppDataProvider = ({ children, user }: AppDataProviderProps) => {
  const supabase = getSupabaseClient();
  const defaultProfile = useMemo(() => createDefaultProfile(user), [user]);

  const [drive, setDrive] = useState<DriveState>(() =>
    readStorage(STORAGE_KEYS.drive, createDefaultDriveState())
  );
  const [notes, setNotes] = useState<NotesState>(() =>
    readStorage(STORAGE_KEYS.notes, createDefaultNotesState())
  );
  const [organisation, setOrganisation] = useState<OrganisationState>(() =>
    normalizeOrganisationState(readStorage(STORAGE_KEYS.organisation, createDefaultOrganisationState()))
  );
  const [activities, setActivities] = useState<WidgetActivity[]>(() =>
    readStorage(STORAGE_KEYS.activities, [] as WidgetActivity[])
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    readStorage(STORAGE_KEYS.notifications, [] as SystemNotification[])
  );
  const [widgetLayout, setWidgetLayout] = useState<WidgetLayout>(() =>
    readStorage(STORAGE_KEYS.layout, defaultLayout)
  );
  const [clipboard, setClipboard] = useState<ClipboardState>(initialClipboard);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    readStorage(STORAGE_KEYS.chat, defaultMessages)
  );
  const [profile, setProfile] = useState<UserProfile>(() =>
    readStorage(STORAGE_KEYS.profile, defaultProfile)
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Intégration Supabase : hydratation initiale des espaces pour l'utilisateur actif.
  const hydrateFromSupabase = useCallback(async () => {
    if (!supabase) {
      setIsHydrated(true);
      return;
    }
    setIsHydrating(true);
    try {
      const { data, error } = await supabase
        .from("app_state")
        .select("drive, notes, organisation, activities, widget_layout, profile, chat, notifications")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116" && error.code !== "PGRST123") {
        console.error("Hydratation Supabase impossible", error.message);
      }

      if (!data) {
        const defaults = {
          drive: createDefaultDriveState(),
          notes: createDefaultNotesState(),
          organisation: createDefaultOrganisationState(),
          activities: [] as WidgetActivity[],
          widget_layout: defaultLayout,
          profile: defaultProfile,
          chat: defaultMessages,
          notifications: [] as SystemNotification[],
        };
        await supabase.from("app_state").upsert({ user_id: user.id, ...defaults });
        setDrive(defaults.drive);
        setNotes(defaults.notes);
        setOrganisation(defaults.organisation);
        setActivities(defaults.activities);
        setWidgetLayout(defaults.widget_layout);
        setProfile(defaultProfile);
        setChatMessages(defaults.chat);
        setNotifications(defaults.notifications);
      } else {
        const driveState = (data.drive as DriveState | null) ?? createDefaultDriveState();
        setDrive(driveState.rootId ? driveState : createDefaultDriveState());
        setNotes((data.notes as NotesState | null) ?? createDefaultNotesState());
        const storedOrganisation =
          (data.organisation as OrganisationState | null) ?? createDefaultOrganisationState();
        setOrganisation(normalizeOrganisationState(storedOrganisation));
        setActivities((data.activities as WidgetActivity[] | null) ?? []);
        setWidgetLayout((data.widget_layout as WidgetLayout | null) ?? defaultLayout);
        const profileState = (data.profile as UserProfile | null) ?? defaultProfile;
        setProfile({
          ...defaultProfile,
          ...profileState,
          id: defaultProfile.id,
          email: defaultProfile.email,
        });
        setChatMessages((data.chat as ChatMessage[] | null) ?? defaultMessages);
        setNotifications((data.notifications as SystemNotification[] | null) ?? []);
      }

      setIsHydrated(true);
    } catch (error) {
      console.error("Hydratation Supabase impossible", error);
      setIsHydrated(true);
    } finally {
      setIsHydrating(false);
    }
  }, [defaultProfile, supabase, user.id]);

  useEffect(() => {
    void hydrateFromSupabase();
  }, [hydrateFromSupabase]);

  useEffect(() => {
    setProfile((prev) => {
      if (prev.id !== defaultProfile.id || prev.email !== defaultProfile.email) {
        return { ...prev, id: defaultProfile.id, email: defaultProfile.email };
      }
      return prev;
    });
  }, [defaultProfile.email, defaultProfile.id]);

  const isSyncing = isHydrating || isPersisting;

  // Intégration Supabase : persistance centralisée de l'état utilisateur.
  const persistState = useCallback(async () => {
    if (!supabase || !isHydrated) {
      return;
    }
    setIsPersisting(true);
    try {
      const payload = {
        user_id: user.id,
        drive,
        notes,
        organisation,
        activities,
        widget_layout: widgetLayout,
        profile,
        chat: chatMessages,
        notifications,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("app_state").upsert(payload);
      if (error) {
        console.error("Synchronisation Supabase impossible", error.message);
      }
    } finally {
      setIsPersisting(false);
    }
  }, [activities, chatMessages, drive, isHydrated, notes, notifications, organisation, profile, supabase, user.id, widgetLayout]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.drive, drive);
    void persistState();
  }, [drive, persistState]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.notes, notes);
    void persistState();
  }, [notes, persistState]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.organisation, organisation);
    void persistState();
  }, [organisation, persistState]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.layout, widgetLayout);
    void persistState();
  }, [widgetLayout, persistState]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.profile, profile);
    void persistState();
  }, [profile, persistState]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.chat, chatMessages);
    void persistState();
  }, [chatMessages, persistState]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.activities, activities);
    void persistState();
  }, [activities, persistState]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.notifications, notifications);
    void persistState();
  }, [notifications, persistState]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    const update = () => setNow(Date.now());
    update();
    // Mise à jour : rafraîchir l'horloge interne chaque minute pour piloter les compteurs de suppression.
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const addActivity = useCallback(
    (activity: Omit<WidgetActivity, "id" | "date"> & { type: WidgetActivity["type"] }) => {
      const newActivity: WidgetActivity = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        ...activity,
      };
      setActivities((prev) => [newActivity, ...prev].slice(0, 20));
    },
    []
  );

  const updateParentTimestamp = useCallback((nodes: Record<string, DriveNode>, parentId: string | null) => {
    if (!parentId) return nodes;
    const parent = nodes[parentId];
    if (!parent || parent.type !== "dossier") return nodes;
    const updatedParent: DriveFolderNode = {
      ...parent,
      misAJourLe: new Date().toISOString(),
    };
    return { ...nodes, [parentId]: updatedParent };
  }, []);

  const createDriveFolder = useCallback(
    (parentId: string, nom: string) => {
      setDrive((prev) => {
        const parent = prev.nodes[parentId];
        if (!parent || parent.type !== "dossier") {
          return prev;
        }
        const id = crypto.randomUUID();
        const nowIso = new Date().toISOString();
        const newFolder: DriveFolderNode = {
          id,
          nom,
          type: "dossier",
          parentId,
          enfants: [],
          partage: false,
          misAJourLe: nowIso,
        };
        const updatedParent: DriveFolderNode = {
          ...parent,
          enfants: [...parent.enfants, id],
          misAJourLe: nowIso,
        };
        const nodes = {
          ...prev.nodes,
          [id]: newFolder,
          [parentId]: updatedParent,
        };
        return { ...prev, nodes: updateParentTimestamp(nodes, parent.parentId) };
      });
      addActivity({
        type: "drive",
        titre: "Dossier créé",
        description: `Nouveau dossier "${nom}".`,
        utilisateur: profile.nom,
      });
    },
    [addActivity, profile.nom, updateParentTimestamp]
  );

  const uploadDriveFiles = useCallback(
    (parentId: string, files: File[]) => {
      if (!files.length) return;

      const processFiles = async () => {
        const prepared = await Promise.all(
          files.map(async (file) => {
            const id = crypto.randomUUID();
            const extension = (file.name.split(".").pop() ?? "fichier").toLowerCase();
            let apercuType: DriveFileNode["apercuType"] = "autre";
            let apercuUrl: string | undefined;
            let contenuTexte: string | undefined;

            // Mise à jour : génération des aperçus locaux pour l'expérience immersive du drive
            if (isBrowser) {
              try {
                if (IMAGE_EXTENSIONS.has(extension)) {
                  apercuType = "image";
                  apercuUrl = await readFileAsDataUrl(file);
                } else if (extension === "pdf") {
                  apercuType = "pdf";
                  apercuUrl = await readFileAsDataUrl(file);
                } else if (DOCUMENT_EXTENSIONS.has(extension)) {
                  apercuType = "document";
                  contenuTexte = await readFileAsText(file);
                } else if (TEXT_EXTENSIONS.has(extension)) {
                  apercuType = "texte";
                  contenuTexte = await readFileAsText(file);
                }
              } catch (error) {
                console.warn("Prévisualisation indisponible pour", file.name, error);
              }
            }

            if (!contenuTexte && DOCUMENT_EXTENSIONS.has(extension)) {
              contenuTexte = `Document importé depuis ${file.name}. Ajuste le texte pour partager ta version.`;
            }

            const node: DriveFileNode = {
              id,
              nom: file.name,
              type: "fichier",
              parentId,
              extension,
              poidsMo: Math.max(file.size / (1024 * 1024), 0.01),
              partage: false,
              misAJourLe: new Date().toISOString(),
              apercuType,
              apercuUrl,
              contenuTexte,
            };

            return node;
          })
        );

        setDrive((prev) => {
          const parent = prev.nodes[parentId];
          if (!parent || parent.type !== "dossier") return prev;
          const nodes = { ...prev.nodes };
          const enfants = [...parent.enfants];
          prepared.forEach((node) => {
            nodes[node.id] = node;
            enfants.push(node.id);
          });
          const nowIso = new Date().toISOString();
          nodes[parentId] = {
            ...(parent as DriveFolderNode),
            enfants,
            misAJourLe: nowIso,
          };
          const updatedNodes = updateParentTimestamp(nodes, parent.parentId);
          return { ...prev, nodes: updatedNodes };
        });

        addActivity({
          type: "drive",
          titre: "Fichiers importés",
          description: `${prepared.length} élément(s) ajouté(s) dans le drive`,
          utilisateur: profile.nom,
        });
      };

      void processFiles();
    },
    [addActivity, profile.nom, updateParentTimestamp]
  );

  const renameDriveNode = useCallback((nodeId: string, nom: string) => {
    setDrive((prev) => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;
      const updatedNode: DriveNode = {
        ...node,
        nom,
        misAJourLe: new Date().toISOString(),
      };
      const nodes = { ...prev.nodes, [nodeId]: updatedNode };
      const updatedNodes = updateParentTimestamp(nodes, node.parentId);
      return { ...prev, nodes: updatedNodes };
    });
    addActivity({
      type: "drive",
      titre: "Élément renommé",
      description: `"${nom}" a été renommé`,
      utilisateur: profile.nom,
    });
  }, [addActivity, profile.nom, updateParentTimestamp]);

  const deleteDriveNode = useCallback((nodeId: string) => {
    setDrive((prev) => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;
      const nodes = { ...prev.nodes };
      const removeRecursive = (id: string) => {
        const current = nodes[id];
        if (!current) return;
        if (current.type === "dossier") {
          current.enfants.forEach(removeRecursive);
        }
        delete nodes[id];
      };
      removeRecursive(nodeId);
      if (node.parentId) {
        const parent = nodes[node.parentId] as DriveFolderNode;
        if (parent) {
          nodes[node.parentId] = {
            ...parent,
            enfants: parent.enfants.filter((id) => id !== nodeId),
            misAJourLe: new Date().toISOString(),
          };
        }
      }
      return { ...prev, nodes };
    });
    addActivity({
      type: "drive",
      titre: "Élément supprimé",
      description: "Un élément a été retiré du drive",
      utilisateur: profile.nom,
    });
  }, [addActivity, profile.nom]);

  const updateDriveFile = useCallback(
    (nodeId: string, updates: Partial<DriveFileNode>) => {
      let previousName = "Fichier";
      setDrive((prev) => {
        const node = prev.nodes[nodeId];
        if (!node || node.type !== "fichier") return prev;
        previousName = node.nom;
        const updatedNode: DriveFileNode = {
          ...node,
          ...updates,
          misAJourLe: new Date().toISOString(),
        };
        const nodes = { ...prev.nodes, [nodeId]: updatedNode };
        const updatedNodes = updateParentTimestamp(nodes, node.parentId);
        return { ...prev, nodes: updatedNodes };
      });
      addActivity({
        type: "drive",
        titre: "Fichier mis à jour",
        description: `Le contenu de "${previousName}" a été actualisé`,
        utilisateur: profile.nom,
      });
    },
    [addActivity, profile.nom, updateParentTimestamp]
  );

  const moveDriveNode = useCallback((nodeId: string, targetFolderId: string) => {
    setDrive((prev) => {
      const node = prev.nodes[nodeId];
      const target = prev.nodes[targetFolderId];
      if (!node || !target || target.type !== "dossier") return prev;
      const nodes = { ...prev.nodes };
      if (node.parentId) {
        const parent = nodes[node.parentId];
        if (parent && parent.type === "dossier") {
          nodes[node.parentId] = {
            ...parent,
            enfants: parent.enfants.filter((id) => id !== nodeId),
            misAJourLe: new Date().toISOString(),
          };
        }
      }
      nodes[nodeId] = {
        ...node,
        parentId: targetFolderId,
        misAJourLe: new Date().toISOString(),
      };
      const updatedTarget = nodes[targetFolderId] as DriveFolderNode;
      nodes[targetFolderId] = {
        ...updatedTarget,
        enfants: [...updatedTarget.enfants, nodeId],
        misAJourLe: new Date().toISOString(),
      };
      return { ...prev, nodes };
    });
    addActivity({
      type: "drive",
      titre: "Élément déplacé",
      description: "Un élément a été déplacé vers un dossier",
      utilisateur: profile.nom,
    });
  }, [addActivity, profile.nom]);

  const copyDriveNode = useCallback((nodeId: string) => {
    setClipboard({ elementId: nodeId, mode: "copy" });
  }, []);

  const cutDriveNode = useCallback((nodeId: string) => {
    setClipboard({ elementId: nodeId, mode: "cut" });
  }, []);

  const clearClipboard = useCallback(() => setClipboard(initialClipboard), []);

  const pasteClipboard = useCallback((targetFolderId: string) => {
    setDrive((prev) => {
      const target = prev.nodes[targetFolderId];
      if (!target || target.type !== "dossier" || !clipboard.elementId || !clipboard.mode) {
        return prev;
      }
      const nodes = { ...prev.nodes };
      const nowIso = new Date().toISOString();
      if (clipboard.mode === "cut") {
        const node = nodes[clipboard.elementId];
        if (!node) return prev;
        if (node.parentId) {
          const currentParent = nodes[node.parentId];
          if (currentParent && currentParent.type === "dossier") {
            nodes[node.parentId] = {
              ...currentParent,
              enfants: currentParent.enfants.filter((id) => id !== node.id),
              misAJourLe: nowIso,
            };
          }
        }
        nodes[node.id] = {
          ...node,
          parentId: targetFolderId,
          misAJourLe: nowIso,
        };
        const destination = nodes[targetFolderId] as DriveFolderNode;
        nodes[targetFolderId] = {
          ...destination,
          enfants: [...destination.enfants, node.id],
          misAJourLe: nowIso,
        };
      } else {
        const clone = cloneDriveSubtree(nodes, clipboard.elementId, targetFolderId);
        if (!clone.rootId) return prev;
        const destination = nodes[targetFolderId] as DriveFolderNode;
        nodes[targetFolderId] = {
          ...destination,
          enfants: [...destination.enfants, clone.rootId],
          misAJourLe: nowIso,
        };
        Object.assign(nodes, clone.nodes);
      }
      return { ...prev, nodes };
    });
    clearClipboard();
    addActivity({
      type: "drive",
      titre: "Coller dans le drive",
      description: "Une action de collage vient d'être effectuée",
      utilisateur: profile.nom,
    });
  }, [addActivity, clearClipboard, clipboard.elementId, clipboard.mode, profile.nom]);

  const createNoteFolder = useCallback(
    (parentId: string, nom: string) => {
      const id = crypto.randomUUID();
      setNotes((prev) => {
        const folders = { ...prev.folders };
        folders[id] = {
          id,
          nom,
          parentId,
          enfants: [],
        };
        const parent = folders[parentId];
        if (parent) {
          folders[parentId] = {
            ...parent,
            enfants: [...parent.enfants, id],
          };
        }
        return { ...prev, folders };
      });
      addActivity({
        type: "notes",
        titre: "Dossier de notes créé",
        description: `Nouveau dossier "${nom}"`,
        utilisateur: profile.nom,
      });
      return id;
    },
    [addActivity, profile.nom]
  );

  const renameNoteFolder = useCallback((folderId: string, nom: string) => {
    setNotes((prev) => {
      const folder = prev.folders[folderId];
      if (!folder) return prev;
      return {
        ...prev,
        folders: {
          ...prev.folders,
          [folderId]: { ...folder, nom },
        },
      };
    });
  }, []);

  // Nouvelle fonctionnalité : suppression récursive de dossiers de notes avec nettoyage des enfants.
  const deleteNoteFolder = useCallback(
    (folderId: string) => {
      setNotes((prev) => {
        const target = prev.folders[folderId];
        if (!target || target.parentId === null) {
          return prev;
        }

        const folders = { ...prev.folders };
        const notesMap = { ...prev.notes };
        const toDelete = new Set<string>();

        const collect = (id: string) => {
          if (toDelete.has(id)) {
            return;
          }
          toDelete.add(id);
          const folder = folders[id];
          folder?.enfants.forEach((childId) => collect(childId));
        };

        collect(folderId);

        const nextFolders: Record<string, NoteFolder> = {};
        Object.values(folders).forEach((folder) => {
          if (toDelete.has(folder.id)) {
            return;
          }
          nextFolders[folder.id] = {
            ...folder,
            enfants: folder.enfants.filter((childId) => !toDelete.has(childId)),
          };
        });

        const nextNotes: Record<string, Note> = {};
        Object.entries(notesMap).forEach(([noteId, note]) => {
          if (note.dossierId && toDelete.has(note.dossierId)) {
            return;
          }
          nextNotes[noteId] = note;
        });

        return { folders: nextFolders, notes: nextNotes };
      });

      addActivity({
        type: "notes",
        titre: "Dossier supprimé",
        description: "Un dossier de notes a été retiré",
        utilisateur: profile.nom,
      });
    },
    [addActivity, profile.nom]
  );

  const createNote = useCallback(
    ({ dossierId, titre }: { dossierId: string; titre?: string }) => {
      const id = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      setNotes((prev) => {
        const note: Note = {
          id,
          dossierId,
          titre: titre ?? "Nouvelle note",
          contenu: "Commence à écrire…",
          misAJourLe: nowIso,
        };
        return {
          ...prev,
          notes: { ...prev.notes, [id]: note },
        };
      });
      addActivity({
        type: "notes",
        titre: "Note créée",
        description: "Une nouvelle note a été ajoutée",
        utilisateur: profile.nom,
      });
      return id;
    },
    [addActivity, profile.nom]
  );

  const updateNote = useCallback((noteId: string, contenu: string, titre?: string) => {
    const nowIso = new Date().toISOString();
    setNotes((prev) => {
      const note = prev.notes[noteId];
      if (!note) return prev;
      return {
        ...prev,
        notes: {
          ...prev.notes,
          [noteId]: {
            ...note,
            contenu,
            titre: titre ?? note.titre,
            misAJourLe: nowIso,
          },
        },
      };
    });
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setNotes((prev) => {
      if (!prev.notes[noteId]) return prev;
      const notesMap = { ...prev.notes };
      delete notesMap[noteId];
      return { ...prev, notes: notesMap };
    });
  }, []);

  const moveNote = useCallback((noteId: string, dossierId: string) => {
    setNotes((prev) => {
      const note = prev.notes[noteId];
      if (!note) return prev;
      return {
        ...prev,
        notes: {
          ...prev.notes,
          [noteId]: {
            ...note,
            dossierId,
            misAJourLe: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const saveWidgetLayout = useCallback((layout: WidgetLayout) => {
    setWidgetLayout(layout);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  }, []);

  const replaceChatMessages = useCallback((messages: ChatMessage[]) => {
    setChatMessages(messages);
  }, []);

  const addNotification = useCallback(
    ({ titre, message, niveau = "info" }: { titre: string; message: string; niveau?: SystemNotification["niveau"] }) => {
      setNotifications((prev) => [
        {
          id: crypto.randomUUID(),
          titre,
          message,
          date: new Date().toISOString(),
          lu: false,
          niveau,
        },
        ...prev,
      ]);
    },
    []
  );

  const markNotificationsAsRead = useCallback((ids?: string[]) => {
    setNotifications((prev) => {
      if (!ids || ids.length === 0) {
        return prev.map((notification) => (notification.lu ? notification : { ...notification, lu: true }));
      }
      const allowed = new Set(ids);
      return prev.map((notification) =>
        allowed.has(notification.id) ? { ...notification, lu: true } : notification
      );
    });
  }, []);

  const saveEvenement = useCallback((evenement: Evenement) => {
    const payload: Evenement = {
      ...evenement,
      priorite: evenement.priorite ?? "normale",
      urgent: evenement.urgent ?? false,
    };
    setOrganisation((prev) => {
      const existingIndex = prev.evenements.findIndex((item) => item.id === payload.id);
      const evenements = [...prev.evenements];
      if (existingIndex >= 0) {
        evenements[existingIndex] = payload;
      } else {
        evenements.push(payload);
      }
      return { ...prev, evenements };
    });
  }, []);

  const deleteEvenement = useCallback((evenementId: string) => {
    setOrganisation((prev) => ({
      ...prev,
      evenements: prev.evenements.filter((item) => item.id !== evenementId),
    }));
  }, []);

  const saveTache = useCallback((tache: Tache) => {
    const normalized: Tache = {
      ...tache,
      termineeLe: tache.statut === "termine" ? tache.termineeLe ?? new Date().toISOString() : undefined,
    };
    setOrganisation((prev) => {
      const index = prev.taches.findIndex((item) => item.id === normalized.id);
      const taches = [...prev.taches];
      if (index >= 0) {
        taches[index] = normalized;
      } else {
        taches.push(normalized);
      }
      return { ...prev, taches };
    });
  }, []);

  const deleteTache = useCallback((tacheId: string) => {
    setOrganisation((prev) => ({
      ...prev,
      taches: prev.taches.filter((item) => item.id !== tacheId),
    }));
  }, []);

  const saveRappel = useCallback((rappel: Rappel) => {
    setOrganisation((prev) => {
      const index = prev.rappels.findIndex((item) => item.id === rappel.id);
      const rappels = [...prev.rappels];
      if (index >= 0) {
        rappels[index] = rappel;
      } else {
        rappels.push(rappel);
      }
      return { ...prev, rappels };
    });
  }, []);

  const deleteRappel = useCallback((rappelId: string) => {
    setOrganisation((prev) => ({
      ...prev,
      rappels: prev.rappels.filter((item) => item.id !== rappelId),
    }));
  }, []);

  // Mise à jour : surveillance des tâches terminées pour générer un décompte automatique et notifier la suppression à J+1.
  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    const interval = window.setInterval(() => {
      const nowTimestamp = Date.now();
      const expired: Tache[] = [];
      setOrganisation((prev) => {
        const remaining = prev.taches.filter((task) => {
          if (task.statut === "termine" && task.termineeLe) {
            const completedAt = new Date(task.termineeLe).getTime();
            if (nowTimestamp - completedAt >= 86_400_000) {
              expired.push(task);
              return false;
            }
          }
          return true;
        });
        if (expired.length === 0) {
          return prev;
        }
        return { ...prev, taches: remaining };
      });
      expired.forEach((task) => {
        addNotification({
          titre: "Tâche archivée",
          message: `"${task.titre}" a été supprimée après 24 heures de complétion.`,
        });
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [addNotification]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      drive,
      notes,
      organisation,
      activities,
      widgetLayout,
      clipboard,
      chatMessages,
      profile,
      notifications,
      now,
      isHydrated,
      isSyncing,
      refreshFromSupabase: hydrateFromSupabase,
      createDriveFolder,
      uploadDriveFiles,
      renameDriveNode,
      deleteDriveNode,
      moveDriveNode,
      copyDriveNode,
      cutDriveNode,
      pasteClipboard,
      updateDriveFile,
      clearClipboard,
      createNoteFolder,
      renameNoteFolder,
      deleteNoteFolder,
      createNote,
      updateNote,
      deleteNote,
      moveNote,
      saveWidgetLayout,
      updateProfile,
      addActivity,
      addChatMessage,
      replaceChatMessages,
      addNotification,
      markNotificationsAsRead,
      saveEvenement,
      deleteEvenement,
      saveTache,
      deleteTache,
      saveRappel,
      deleteRappel,
    }),
    [
      activities,
      addActivity,
      addChatMessage,
      clearClipboard,
      chatMessages,
      clipboard,
      copyDriveNode,
      createDriveFolder,
      createNote,
      createNoteFolder,
      deleteNoteFolder,
      cutDriveNode,
      deleteDriveNode,
      deleteNote,
      deleteEvenement,
      deleteRappel,
      deleteTache,
      drive,
      hydrateFromSupabase,
      isHydrated,
      isSyncing,
      markNotificationsAsRead,
      moveDriveNode,
      moveNote,
      notifications,
      now,
      notes,
      organisation,
      pasteClipboard,
      profile,
      renameDriveNode,
      renameNoteFolder,
      replaceChatMessages,
      addNotification,
      updateDriveFile,
      saveEvenement,
      saveRappel,
      saveTache,
      saveWidgetLayout,
      updateNote,
      updateProfile,
      uploadDriveFiles,
      widgetLayout,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData doit être utilisé dans un AppDataProvider");
  }
  return context;
};
