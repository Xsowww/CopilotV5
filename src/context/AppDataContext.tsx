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
import {
  activities as activitiesSeed,
  defaultProfile,
  driveInitialState,
  evenements as evenementsSeed,
  initialMessages,
  noteInitialState,
  rappels as rappelsSeed,
  taches as tachesSeed,
} from "../data/mockData";
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
  Tache,
  UserProfile,
  WidgetActivity,
  WidgetLayout,
} from "../types";

interface DriveState {
  rootId: string;
  nodes: Record<string, DriveNode>;
}

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
  createDriveFolder: (parentId: string, nom: string) => void;
  uploadDriveFiles: (parentId: string, files: File[]) => void;
  renameDriveNode: (nodeId: string, nom: string) => void;
  deleteDriveNode: (nodeId: string) => void;
  moveDriveNode: (nodeId: string, targetFolderId: string) => void;
  copyDriveNode: (nodeId: string) => void;
  cutDriveNode: (nodeId: string) => void;
  pasteClipboard: (targetFolderId: string) => void;
  clearClipboard: () => void;
  createNoteFolder: (parentId: string, nom: string) => string;
  renameNoteFolder: (folderId: string, nom: string) => void;
  createNote: (payload: { dossierId: string; titre?: string }) => string;
  updateNote: (noteId: string, contenu: string, titre?: string) => void;
  deleteNote: (noteId: string) => void;
  moveNote: (noteId: string, dossierId: string) => void;
  saveWidgetLayout: (layout: WidgetLayout) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addActivity: (activity: Omit<WidgetActivity, "id" | "date"> & { type: WidgetActivity["type"] }) => void;
  addChatMessage: (message: ChatMessage) => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
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
};

const isBrowser = typeof window !== "undefined";

const readStorage = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
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

export const AppDataProvider = ({ children }: PropsWithChildren) => {
  const [drive, setDrive] = useState<DriveState>(() => readStorage(STORAGE_KEYS.drive, driveInitialState));
  const [notes, setNotes] = useState<NotesState>(() => readStorage(STORAGE_KEYS.notes, noteInitialState));
  const [organisation, setOrganisation] = useState<OrganisationState>(() => {
    const fallback: OrganisationState = {
      evenements: evenementsSeed,
      taches: tachesSeed,
      rappels: rappelsSeed,
    };
    return readStorage(STORAGE_KEYS.organisation, fallback);
  });
  const [activities, setActivities] = useState<WidgetActivity[]>(() => activitiesSeed);
  const [widgetLayout, setWidgetLayout] = useState<WidgetLayout>(() => readStorage(STORAGE_KEYS.layout, defaultLayout));
  const [clipboard, setClipboard] = useState<ClipboardState>(initialClipboard);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => readStorage(STORAGE_KEYS.chat, initialMessages));
  const [profile, setProfile] = useState<UserProfile>(() => readStorage(STORAGE_KEYS.profile, defaultProfile));

  useEffect(() => {
    writeStorage(STORAGE_KEYS.drive, drive);
  }, [drive]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.notes, notes);
  }, [notes]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.organisation, organisation);
  }, [organisation]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.layout, widgetLayout);
  }, [widgetLayout]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.profile, profile);
  }, [profile]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.chat, chatMessages);
  }, [chatMessages]);

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
      setDrive((prev) => {
        const parent = prev.nodes[parentId];
        if (!parent || parent.type !== "dossier") return prev;
        const nowIso = new Date().toISOString();
        const nodes = { ...prev.nodes };
        const enfants = [...parent.enfants];
        files.forEach((file) => {
          const id = crypto.randomUUID();
          const extension = file.name.split(".").pop() ?? "fichier";
          const node: DriveFileNode = {
            id,
            nom: file.name,
            type: "fichier",
            parentId,
            extension,
            poidsMo: Math.max(file.size / (1024 * 1024), 0.01),
            partage: false,
            misAJourLe: nowIso,
          };
          nodes[id] = node;
          enfants.push(id);
        });
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
        description: `${files.length} élément(s) ajouté(s) dans le drive`,
        utilisateur: profile.nom,
      });
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

  const saveEvenement = useCallback((evenement: Evenement) => {
    setOrganisation((prev) => {
      const existingIndex = prev.evenements.findIndex((item) => item.id === evenement.id);
      const evenements = [...prev.evenements];
      if (existingIndex >= 0) {
        evenements[existingIndex] = evenement;
      } else {
        evenements.push(evenement);
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
    setOrganisation((prev) => {
      const index = prev.taches.findIndex((item) => item.id === tache.id);
      const taches = [...prev.taches];
      if (index >= 0) {
        taches[index] = tache;
      } else {
        taches.push(tache);
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
      createDriveFolder,
      uploadDriveFiles,
      renameDriveNode,
      deleteDriveNode,
      moveDriveNode,
      copyDriveNode,
      cutDriveNode,
      pasteClipboard,
      clearClipboard,
      createNoteFolder,
      renameNoteFolder,
      createNote,
      updateNote,
      deleteNote,
      moveNote,
      saveWidgetLayout,
      updateProfile,
      addActivity,
      addChatMessage,
      replaceChatMessages,
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
      replaceChatMessages,
      chatMessages,
      clipboard,
      createDriveFolder,
      createNote,
      createNoteFolder,
      deleteDriveNode,
      deleteNote,
      deleteEvenement,
      deleteRappel,
      deleteTache,
      drive,
      moveDriveNode,
      moveNote,
      notes,
      organisation,
      pasteClipboard,
      profile,
      renameDriveNode,
      renameNoteFolder,
      saveEvenement,
      saveRappel,
      saveTache,
      saveWidgetLayout,
      updateNote,
      updateProfile,
      uploadDriveFiles,
      widgetLayout,
      cutDriveNode,
      copyDriveNode,
      clearClipboard,
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
