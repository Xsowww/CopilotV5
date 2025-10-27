export type Priority = "faible" | "normale" | "haute";
export type TaskStatus = "pas_commence" | "en_cours" | "termine";

export type DriveNodeType = "dossier" | "fichier";

export interface BaseDriveNode {
  id: string;
  nom: string;
  type: DriveNodeType;
  parentId: string | null;
  misAJourLe: string;
}

export type DrivePreviewType = "image" | "pdf" | "document" | "texte" | "autre";

export interface DriveFileNode extends BaseDriveNode {
  type: "fichier";
  extension: string;
  poidsMo: number;
  partage: boolean;
  apercuType: DrivePreviewType;
  apercuUrl?: string;
  contenuTexte?: string;
}

export interface DriveFolderNode extends BaseDriveNode {
  type: "dossier";
  enfants: string[];
  partage: boolean;
}

export type DriveNode = DriveFileNode | DriveFolderNode;

export interface Note {
  id: string;
  titre: string;
  dossierId: string;
  contenu: string;
  misAJourLe: string;
  etiquettes?: string[];
}

export interface NoteFolder {
  id: string;
  nom: string;
  parentId: string | null;
  enfants: string[];
}

export interface OrganisationItemBase {
  id: string;
  titre: string;
  description?: string;
  date: string;
  heure?: string;
}

// Modification : un événement gère désormais la notion d'urgence et de priorité plutôt qu'une localisation.
export interface Evenement extends OrganisationItemBase {
  priorite: Priority;
  urgent: boolean;
  categorie?: string;
}

export interface Tache extends OrganisationItemBase {
  priorite: Priority;
  statut: TaskStatus;
  echeance: string;
  /**
   * Horodatage local utilisé pour calculer le compte à rebours de suppression après validation.
   * Ajout suite à la demande utilisateur d'afficher un timer dynamique avant purge automatique.
   */
  termineeLe?: string;
}

export interface Rappel extends OrganisationItemBase {
  recurrent?: boolean;
}

export interface WidgetActivity {
  id: string;
  type: "drive" | "organisation" | "notes";
  titre: string;
  description: string;
  date: string;
  utilisateur: string;
}

export interface ChatMessage {
  id: string;
  role: "utilisateur" | "assistant";
  contenu: string;
  horodatage: string;
}

export interface UserProfile {
  id: string;
  nom: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  statut?: string;
  /**
   * Indicateur de préférences de notifications (ajout suite aux retours sur le profil utilisateur).
   */
  notificationsActives: boolean;
}

export type WidgetId = "drive" | "notes" | "organisation" | "activite";

export interface WidgetLayout {
  colonneGauche: WidgetId[];
  colonneDroite: WidgetId[];
}

export interface ClipboardState {
  elementId: string | null;
  mode: "copy" | "cut" | null;
}

export interface SystemNotification {
  id: string;
  titre: string;
  message: string;
  date: string;
  lu: boolean;
  niveau: "info" | "alerte";
}
