import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PiPaperPlaneRightFill } from "react-icons/pi";
import type { ChatMessage } from "../../types";
import { mockApi } from "../../services/mockApi";
import { formatRelativeDate } from "../../utils/formatters";

export const CopilotChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    mockApi.fetchChatHistory().then(setMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "utilisateur",
      contenu: input,
      horodatage: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    const response = await mockApi.sendChatMessage(input.trim());

    setMessages((prev) => [...prev, response]);
    setLoading(false);
  };

  return (
    <div className="copilot-chatbot" aria-live="polite">
      <header className="copilot-chatbot__header">
        <div>
          <p className="copilot-chatbot__title">Copilot</p>
          <span className="copilot-chatbot__subtitle">Assistant intelligent</span>
        </div>
        <span className="copilot-chatbot__status">Disponible</span>
      </header>
      <div className="copilot-chatbot__messages">
        {messages.map((message) => (
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
  );
};
