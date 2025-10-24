import { addDays, addHours, formatISO, subDays } from "date-fns";
import type {
  ChatMessage,
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
} from "../types";

const now = new Date();

const driveFolders: Record<string, DriveFolderNode> = {
  "drive-root": {
    id: "drive-root",
    nom: "Copilot Drive",
    type: "dossier",
    parentId: null,
    enfants: ["drive-cours", "drive-projet", "drive-budget", "drive-doc-1"],
    partage: true,
    misAJourLe: formatISO(now),
  },
  "drive-cours": {
    id: "drive-cours",
    nom: "Cours - Intelligence artificielle",
    type: "dossier",
    parentId: "drive-root",
    enfants: ["drive-cours-notes", "drive-doc-3"],
    partage: true,
    misAJourLe: formatISO(subDays(now, 1)),
  },
  "drive-cours-notes": {
    id: "drive-cours-notes",
    nom: "Notes de cours",
    type: "dossier",
    parentId: "drive-cours",
    enfants: [],
    partage: false,
    misAJourLe: formatISO(subDays(now, 2)),
  },
  // Mise à jour : ajustement de la hiérarchie pour intégrer les nouveaux aperçus
  "drive-projet": {
    id: "drive-projet",
    nom: "Projet Copilot",
    type: "dossier",
    parentId: "drive-root",
    enfants: ["drive-doc-4", "drive-doc-2"],
    partage: true,
    misAJourLe: formatISO(subDays(now, 2)),
  },
  "drive-budget": {
    id: "drive-budget",
    nom: "Budget BDE",
    type: "dossier",
    parentId: "drive-root",
    enfants: [],
    partage: false,
    misAJourLe: formatISO(subDays(now, 3)),
  },
};

const driveFiles: Record<string, DriveFileNode> = {
  "drive-doc-1": {
    id: "drive-doc-1",
    nom: "Présentation rentrée.pdf",
    type: "fichier",
    parentId: "drive-root",
    extension: "pdf",
    poidsMo: 3.2,
    partage: true,
    misAJourLe: formatISO(subDays(now, 1)),
    apercuType: "pdf",
    apercuUrl: "/previews/presentation.pdf",
  },
  "drive-doc-2": {
    id: "drive-doc-2",
    nom: "Compte rendu séance 5.pdf",
    type: "fichier",
    parentId: "drive-projet",
    extension: "pdf",
    poidsMo: 2.4,
    partage: false,
    misAJourLe: formatISO(subDays(now, 4)),
    apercuType: "pdf",
    apercuUrl: "/previews/compte-rendu.pdf",
  },
  "drive-doc-3": {
    id: "drive-doc-3",
    nom: "Synthèse chapitre 2.docx",
    type: "fichier",
    parentId: "drive-cours",
    extension: "docx",
    poidsMo: 1.1,
    partage: false,
    misAJourLe: formatISO(subDays(now, 1)),
    apercuType: "document",
    contenuTexte:
      "Synthèse initiale importée. Utilise l'éditeur pour compléter ou modifier le contenu du document.",
  },
  "drive-doc-4": {
    id: "drive-doc-4",
    nom: "Roadmap Copilot.xlsx",
    type: "fichier",
    parentId: "drive-projet",
    extension: "xlsx",
    poidsMo: 0.8,
    partage: true,
    misAJourLe: formatISO(subDays(now, 2)),
    apercuType: "autre",
  },
};

export const driveInitialState: { rootId: string; nodes: Record<string, DriveNode> } = {
  rootId: "drive-root",
  nodes: { ...driveFolders, ...driveFiles },
};

export const noteFolders: Record<string, NoteFolder> = {
  "note-root": {
    id: "note-root",
    nom: "Toutes les notes",
    parentId: null,
    enfants: ["note-projet", "note-cours", "note-association"],
  },
  "note-projet": {
    id: "note-projet",
    nom: "Notes de projet",
    parentId: "note-root",
    enfants: [],
  },
  "note-cours": {
    id: "note-cours",
    nom: "Cours",
    parentId: "note-root",
    enfants: [],
  },
  "note-association": {
    id: "note-association",
    nom: "Association étudiante",
    parentId: "note-root",
    enfants: [],
  },
};

export const noteInitialState: { folders: Record<string, NoteFolder>; notes: Record<string, Note> } = {
  folders: noteFolders,
  notes: {
    "note-1": {
      id: "note-1",
      titre: "Objectif VR",
      dossierId: "note-projet",
      contenu:
        "Améliorer le retour d'expérience et prévoir un test utilisateur grandeur nature en novembre.",
      misAJourLe: formatISO(addHours(now, -3)),
      etiquettes: ["Projet", "Innovation"],
    },
    "note-2": {
      id: "note-2",
      titre: "Cours de cybersécurité",
      dossierId: "note-cours",
      contenu:
        "Rappeler les bonnes pratiques: MFA obligatoire, chiffrement disque, sauvegardes chiffrées.",
      misAJourLe: formatISO(subDays(now, 1)),
    },
    "note-3": {
      id: "note-3",
      titre: "To-do association",
      dossierId: "note-association",
      contenu: "1. Finaliser la campagne d'adhésion\n2. Préparer la soirée d'accueil",
      misAJourLe: formatISO(subDays(now, 2)),
      etiquettes: ["Urgent"],
    },
  },
};

export const evenements: Evenement[] = [
  {
    id: "event-1",
    titre: "Réunion de projet Copilot",
    date: formatISO(now),
    heure: "10:00",
    localisation: "Salle Innovation",
    description: "Point d'étape sur le développement du dashboard",
    categorie: "Projet",
  },
  {
    id: "event-2",
    titre: "Cours magistral - IA générative",
    date: formatISO(addHours(now, 24)),
    heure: "14:00",
    localisation: "Amphi 3",
    description: "Séance animée par le Pr. Girard",
    categorie: "Cours",
  },
  {
    id: "event-3",
    titre: "Atelier design iCloud",
    date: formatISO(addDays(now, 2)),
    heure: "09:30",
    localisation: "Studio 2",
    description: "Atelier pratique pour calquer l'UI iCloud",
    categorie: "Atelier",
  },
];

export const taches: Tache[] = [
  {
    id: "task-1",
    titre: "Finaliser le prototype UI",
    date: formatISO(addHours(now, 48)),
    heure: "18:00",
    priorite: "haute",
    statut: "en_cours",
    description: "Préparer la version miroir du design iCloud",
    echeance: formatISO(addHours(now, 72)),
  },
  {
    id: "task-2",
    titre: "Envoyer le compte rendu de réunion",
    date: formatISO(addHours(now, 6)),
    priorite: "normale",
    statut: "pas_commence",
    description: "Partager la synthèse aux membres du projet",
    echeance: formatISO(addHours(now, 24)),
  },
];

export const rappels: Rappel[] = [
  {
    id: "reminder-1",
    titre: "Renouveler l'abonnement bibliothèque",
    date: formatISO(addHours(now, 72)),
    description: "À faire avant vendredi midi",
  },
  {
    id: "reminder-2",
    titre: "Appeler le service stages",
    date: formatISO(addHours(now, 30)),
    description: "Confirmer les disponibilités pour l'entretien",
    recurrent: false,
  },
];

export const activities: WidgetActivity[] = [
  {
    id: "activity-1",
    type: "drive",
    titre: "Nouveau dossier partagé",
    description: "Léo a partagé \"Projet Copilot\" avec toi",
    date: formatISO(addHours(now, -2)),
    utilisateur: "Léo Martin",
  },
  {
    id: "activity-2",
    type: "organisation",
    titre: "Tâche complétée",
    description: "Tu as terminé \"Préparer les slides\"",
    date: formatISO(addHours(now, -12)),
    utilisateur: "Toi",
  },
  {
    id: "activity-3",
    type: "notes",
    titre: "Note mise à jour",
    description: "\"Objectif VR\" a été modifiée",
    date: formatISO(addHours(now, -5)),
    utilisateur: "Toi",
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: "chat-1",
    role: "assistant",
    contenu:
      "Bonjour ! Je suis Copilot, prêt à t'aider pour organiser ta vie étudiante. Dis-moi ce que je peux faire pour toi.",
    horodatage: formatISO(now),
  },
];

export const defaultProfile: UserProfile = {
  id: "user-1",
  nom: "Léo Martin",
  email: "leo.martin@copilot.app",
  avatarUrl: "https://i.pravatar.cc/128?img=12",
  bio: "Étudiant passionné de design et de productivité.",
  statut: "Disponible",
};
