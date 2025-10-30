const API_BASE_URL = "https://api.mistral.ai/v1/beta/conversations";
const API_KEY = (import.meta.env.VITE_MISTRAL_API_KEY as string | undefined)?.trim();
const AGENT_ID = (import.meta.env.VITE_MISTRAL_AGENT_ID as string | undefined)?.trim();

interface ConversationStartResponse {
  id?: string;
  conversation_id?: string;
  conversation?: { id?: string };
  outputs?: unknown;
}

interface ConversationResponse {
  outputs?: unknown;
}

interface ConversationMessagePayload {
  role: "user";
  content: Array<{ type: "input_text"; text: string }>;
}

const extractText = (source: unknown): string | null => {
  if (!source) return null;
  if (typeof source === "string") {
    return source.trim();
  }
  if (Array.isArray(source)) {
    const parts = source
      .map((item) => extractText(item))
      .filter((part): part is string => Boolean(part?.length));
    if (parts.length > 0) {
      return parts.join("\n\n").trim();
    }
    return null;
  }
  if (typeof source === "object") {
    const value = source as Record<string, unknown>;
    if (typeof value.text === "string") {
      return value.text.trim();
    }
    if (value.message) {
      const nested = extractText(value.message);
      if (nested) return nested;
    }
    if (value.content) {
      const nested = extractText(value.content);
      if (nested) return nested;
    }
    if (value.output_text) {
      const nested = extractText(value.output_text);
      if (nested) return nested;
    }
  }
  return null;
};

const parseOutputs = (outputs: unknown) => {
  const text = extractText(outputs);
  if (!text) {
    throw new Error("Réponse vide renvoyée par Mistral.");
  }
  return text;
};

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

const resolveConversationId = (payload: ConversationStartResponse) =>
  payload.conversation_id ?? payload.id ?? payload.conversation?.id ?? null;

export class MistralConversationError extends Error {
  shouldResetConversation: boolean;

  constructor(message: string, shouldResetConversation = false) {
    super(message);
    this.name = "MistralConversationError";
    this.shouldResetConversation = shouldResetConversation;
  }
}

export const mistralClient = {
  async startConversation(input: string): Promise<{ conversationId: string; reply: string }> {
    const headers = buildHeaders();

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        agent_id: AGENT_ID,
        inputs: input,
        response_mode: "blocking",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral a renvoyé une erreur (${response.status}) : ${errorText}`);
    }

    const data = (await response.json()) as ConversationStartResponse;
    const conversationId = resolveConversationId(data);

    if (!conversationId) {
      throw new Error("Impossible de récupérer l'identifiant de conversation Mistral.");
    }

    return {
      conversationId,
      reply: parseOutputs(data.outputs),
    };
  },

  async continueConversation(
    conversationId: string,
    input: string
  ): Promise<{ reply: string }> {
    const headers = buildHeaders();

    const messagePayload: ConversationMessagePayload = {
      role: "user",
      content: [
        {
          type: "input_text",
          text: input,
        },
      ],
    };

    const messageResponse = await fetch(`${API_BASE_URL}/${conversationId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(messagePayload),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      const shouldReset = messageResponse.status === 404;
      throw new MistralConversationError(
        `Impossible d'enregistrer le message auprès de Mistral (${messageResponse.status}) : ${errorText}`,
        shouldReset
      );
    }

    const response = await fetch(`${API_BASE_URL}/${conversationId}/responses`, {
      method: "POST",
      headers,
      body: JSON.stringify({ response_mode: "blocking" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const shouldReset = response.status === 404;
      throw new MistralConversationError(
        `Mistral a renvoyé une erreur (${response.status}) : ${errorText}`,
        shouldReset
      );
    }

    const data = (await response.json()) as ConversationResponse;
    return { reply: parseOutputs(data.outputs) };
  },
};

export type MistralClient = typeof mistralClient;
