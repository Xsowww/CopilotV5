import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PiChatTeardropDotsFill, PiMinusBold, PiPaperPlaneRightFill, PiXBold } from "react-icons/pi";
import { useAppData } from "../../context/AppDataContext";
import type { ChatMessage } from "../../types";
import { mockApi } from "../../services/mockApi";
import { formatRelativeDate } from "../../utils/formatters";

export const CopilotChatbot = () => {
  const { chatMessages, addChatMessage } = useAppData();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

    addChatMessage(message);
    setInput("");
    setLoading(true);
    scrollToBottom();

    const response = await mockApi.sendChatMessage(message.contenu);
    addChatMessage(response);
    setLoading(false);
    scrollToBottom();
  };

  useEffect(() => {
    if (isOpen && !isCollapsed) {
      scrollToBottom();
    }
  }, [chatMessages, isOpen, isCollapsed]);

  return (
    <div className="copilot-launcher-wrapper" aria-live="polite">
      {isOpen && (
        <div className={`copilot-chatbot ${isCollapsed ? "copilot-chatbot--collapsed" : ""}`}>
          <header className="copilot-chatbot__header">
            <div>
              <p className="copilot-chatbot__title">Copilot</p>
              <span className="copilot-chatbot__subtitle">Assistant intelligent</span>
            </div>
            <div className="copilot-chatbot__controls">
              <button
                type="button"
                className="copilot-chatbot__control"
                aria-label={isCollapsed ? "Développer la conversation" : "Réduire la conversation"}
                onClick={() => setIsCollapsed((prev) => !prev)}
              >
                <PiMinusBold size={14} />
              </button>
              <button
                type="button"
                className="copilot-chatbot__control"
                aria-label="Fermer Copilot"
                onClick={() => {
                  setIsOpen(false);
                  setIsCollapsed(false);
                }}
              >
                <PiXBold size={14} />
              </button>
            </div>
          </header>
          {!isCollapsed && (
            <>
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
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="copilot-launcher"
        aria-label="Ouvrir le chatbot Copilot"
        onClick={() => {
          setIsOpen(true);
          setIsCollapsed(false);
          scrollToBottom();
        }}
      >
        <PiChatTeardropDotsFill size={26} />
      </button>
    </div>
  );
};
