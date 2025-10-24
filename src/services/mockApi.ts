import { addSeconds } from "date-fns";
import type { ChatMessage } from "../types";

const artificialDelay = (min = 150, max = 350) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));

export const mockApi = {
  async sendChatMessage(message: string): Promise<ChatMessage> {
    await artificialDelay(250, 600);
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      contenu: `Je vais exécuter la commande : "${message}" (simulation).`,
      horodatage: addSeconds(new Date(), 1).toISOString(),
    };
  },
};

export type MockApi = typeof mockApi;
