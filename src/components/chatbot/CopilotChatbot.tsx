import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PiChatTeardropDotsFill, PiPaperPlaneRightFill } from "react-icons/pi";
import { useAppData } from "../../context/AppDataContext";
import type { ChatMessage } from "../../types";
import { mistralClient } from "../../services/mistralClient";
import { formatRelativeDate } from "../../utils/formatters";

export const CopilotChatbot = () => {
  const { chatMessages, addChatMessage } = useAppData();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: "utilisateur",
      contenu: input.trim(),
      horodatage: new Date().toISOString(),
    };

    const history = [...chatMessages, message];

    addChatMessage(message);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const mistralMessages = history.slice(-10).map((entry) => ({
        role: entry.role === "assistant" ? "assistant" : "user",
        content: entry.contenu,
      }));

      const reply = await mistralClient.sendMessages(mistralMessages);

      addChatMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        contenu: reply,
        horodatage: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur Mistral", error);
      addChatMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        contenu:
          "Je n'ai pas réussi à contacter Mistral. Vérifie ta connexion ainsi que la clé API, puis réessaie dans un instant.",
        horodatage: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isOpen]);

  return (
    <div className="copilot-launcher-wrapper" aria-live="polite">
      {isOpen && (
        <div className="copilot-chatbot">
          <header className="copilot-chatbot__header">
            <div>
              <p className="copilot-chatbot__title">Copilot</p>
              <span className="copilot-chatbot__subtitle">Assistant intelligent</span>
            </div>
          </header>
          <div className="copilot-chatbot__messages">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "assistant"
                    ? "copilot-chatbot__bubble copilot-chatbot__bubble--assistant"
                    : "copilot-chatbot__bubble copilot-chatbot__bubble--user"
                }
              >
                <p>{message.contenu}</p>
                <span>{formatRelativeDate(message.horodatage)}</span>
              </div>
            ))}
            {loading && (
              <div className="copilot-chatbot__bubble copilot-chatbot__bubble--assistant">
                <p>Je réfléchis…</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form className="copilot-chatbot__form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Demande à Copilot d'agir pour toi…"
              aria-label="Demander une action à Copilot"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              <PiPaperPlaneRightFill size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Mise à jour : ouverture/fermeture du chatbot par un seul bouton discret */}
      <button
        type="button"
        className="copilot-launcher"
        aria-label={isOpen ? "Fermer le chatbot Copilot" : "Ouvrir le chatbot Copilot"}
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            scrollToBottom();
          }
        }}
      >
        <PiChatTeardropDotsFill size={26} />
      </button>
    </div>
  );
};
