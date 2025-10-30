const API_URL = "https://api.mistral.ai/v1/chat/completions";
const API_KEY = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;

interface MistralMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MistralChoice {
  message?: { content?: string };
}

interface MistralResponse {
  choices?: MistralChoice[];
}

const systemPrompt: MistralMessage = {
  role: "system",
  content:
    "Tu es Copilot, l'assistant numérique d'un campus étudiant. Réponds toujours en français, avec un ton amical, en proposant des actions claires et en respectant le contexte fourni.",
};

const mapContent = (content: string) => content.trim();

export const mistralClient = {
  async createChatCompletion(messages: MistralMessage[]): Promise<string> {
    if (!API_KEY) {
      throw new Error("Clé API Mistral manquante. Merci de renseigner VITE_MISTRAL_API_KEY.");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        temperature: 0.6,
        messages: [systemPrompt, ...messages],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral a renvoyé une erreur (${response.status}) : ${errorText}`);
    }

    const data = (await response.json()) as MistralResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Réponse vide renvoyée par Mistral.");
    }

    return mapContent(content);
  },
};

export type MistralClient = typeof mistralClient;
