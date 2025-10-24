import { addSeconds } from "date-fns";
import {
  activities,
  driveItems,
  evenements,
  initialMessages,
  notes,
  rappels,
  taches,
} from "../data/mockData";
import type {
  ChatMessage,
  DriveItem,
  Evenement,
  Note,
  Rappel,
  Tache,
  WidgetActivity,
} from "../types";

const artificialDelay = (min = 150, max = 350) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));

export const mockApi = {
  async fetchDrive(): Promise<DriveItem[]> {
    await artificialDelay();
    return driveItems;
  },
  async fetchNotes(): Promise<Note[]> {
    await artificialDelay();
    return notes;
  },
  async fetchOrganisation(): Promise<{
    evenements: Evenement[];
    taches: Tache[];
    rappels: Rappel[];
  }> {
    await artificialDelay();
    return { evenements, taches, rappels };
  },
  async fetchActivities(): Promise<WidgetActivity[]> {
    await artificialDelay();
    return activities;
  },
  async fetchChatHistory(): Promise<ChatMessage[]> {
    await artificialDelay();
    return initialMessages;
  },
  async sendChatMessage(message: string): Promise<ChatMessage> {
    await artificialDelay(250, 600);
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      contenu: `Je vais exécuter la commande : "${message}" (simulation).` ,
      horodatage: addSeconds(new Date(), 1).toISOString(),
    };
  },
};

export type MockApi = typeof mockApi;
