const API_ROOT_URL = "https://api.mistral.ai/v1";
const API_KEY = (import.meta.env.VITE_MISTRAL_API_KEY as string | undefined)?.trim();
const AGENT_ID = (import.meta.env.VITE_MISTRAL_AGENT_ID as string | undefined)?.trim();

const buildHeaders = () => {
  if (!API_KEY) {
    throw new Error("Clé API Mistral manquante. Merci de renseigner VITE_MISTRAL_API_KEY.");
  }
  if (!AGENT_ID) {
    throw new Error("Identifiant d'agent Mistral manquant. Merci de renseigner VITE_MISTRAL_AGENT_ID.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  } as const;
};

export class MistralConversationError extends Error {
  shouldResetConversation: boolean;

  constructor(message: string, shouldResetConversation = false) {
    super(message);
    this.name = "MistralConversationError";
    this.shouldResetConversation = shouldResetConversation;
  }
}

export const mistralClient = {
  async sendMessages(messages: Array<{ role: "assistant" | "user"; content: string }>): Promise<string> {
    const headers = buildHeaders();

    const sanitizedMessages = messages
      .filter((message) => Boolean(message.content.trim()))
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }));

    if (!sanitizedMessages.length) {
      throw new Error("Aucun message à envoyer à Mistral.");
    }

    const response = await fetch(`${API_ROOT_URL}/agents/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        agent_id: AGENT_ID,
        messages: sanitizedMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const shouldReset = response.status === 404;
      throw new MistralConversationError(
        `Mistral a renvoyé une erreur (${response.status}) : ${errorText}`,
        shouldReset
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string | Array<{ type?: string; text?: string }> };
      }>;
    };

    const messageContent = data.choices?.[0]?.message?.content;

    if (!messageContent) {
      throw new Error("Réponse vide renvoyée par Mistral.");
    }

    if (typeof messageContent === "string") {
      const trimmed = messageContent.trim();
      if (trimmed.length === 0) {
        throw new Error("Réponse vide renvoyée par Mistral.");
      }
      return trimmed;
    }

    if (Array.isArray(messageContent)) {
      const chunks = messageContent
        .map((chunk) => {
          if (typeof chunk === "string") return chunk.trim();
          if (chunk && typeof chunk === "object" && "text" in chunk && typeof chunk.text === "string") {
            return chunk.text.trim();
          }
          return "";
        })
        .filter((value) => value.length > 0);

      if (chunks.length === 0) {
        throw new Error("Réponse vide renvoyée par Mistral.");
      }

      return chunks.join("\n\n");
    }

    throw new Error("Format de réponse Mistral inconnu.");
  },
};

export type MistralClient = typeof mistralClient;
