import { addHours, formatISO, subDays } from "date-fns";
import type {
  ChatMessage,
  DriveItem,
  Evenement,
  Note,
  Rappel,
  Tache,
  WidgetActivity,
} from "../types";

const now = new Date();

export const driveItems: DriveItem[] = [
  {
    id: "drive-1",
    nom: "Cours - Intelligence artificielle",
    type: "dossier",
    derniereModification: formatISO(now),
    proprietaire: "Léo Martin",
    partage: true,
  },
  {
    id: "drive-2",
    nom: "Compte rendu séance 5.pdf",
    type: "pdf",
    derniereModification: formatISO(subDays(now, 1)),
    proprietaire: "Léo Martin",
    partage: false,
    poidsMo: 2.3,
  },
  {
    id: "drive-3",
    nom: "Tableur budget BDE.xlsx",
    type: "tableur",
    derniereModification: formatISO(subDays(now, 2)),
    proprietaire: "Equipe Copilot",
    partage: true,
    poidsMo: 1.1,
  },
];

export const notes: Note[] = [
  {
    id: "note-1",
    titre: "Objectif VR",
    dossier: "Notes de projet",
    contenu:
      "Améliorer le retour d'expérience et prévoir un test utilisateur grandeur nature en novembre.",
    misAJourLe: formatISO(addHours(now, -3)),
    etiquettes: ["Projet", "Innovation"],
  },
  {
    id: "note-2",
    titre: "Cours de cybersécurité",
    dossier: "Cours",
    contenu:
      "Rappeler les bonnes pratiques: MFA obligatoire, chiffrement disque, sauvegardes chiffrées.",
    misAJourLe: formatISO(subDays(now, 1)),
  },
  {
    id: "note-3",
    titre: "To-do association",
    dossier: "Association étudiante",
    contenu: "1. Finaliser la campagne d'adhésion\n2. Préparer la soirée d'accueil",
    misAJourLe: formatISO(subDays(now, 2)),
    etiquettes: ["Urgent"],
  },
];

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
