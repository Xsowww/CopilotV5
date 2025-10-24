export type Priority = "faible" | "normale" | "haute";
export type TaskStatus = "pas_commence" | "en_cours" | "termine";

export interface DriveItem {
  id: string;
  nom: string;
  type: "dossier" | "document" | "tableur" | "presentation" | "pdf" | "autre";
  derniereModification: string;
  proprietaire: string;
  partage: boolean;
  poidsMo?: number;
}

export interface Note {
  id: string;
  titre: string;
  dossier: string;
  contenu: string;
  misAJourLe: string;
  etiquettes?: string[];
}

export interface OrganisationItemBase {
  id: string;
  titre: string;
  description?: string;
  date: string;
  heure?: string;
}

export interface Evenement extends OrganisationItemBase {
  localisation?: string;
  categorie?: string;
}

export interface Tache extends OrganisationItemBase {
  priorite: Priority;
  statut: TaskStatus;
  echeance: string;
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
