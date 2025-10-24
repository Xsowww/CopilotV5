import { PiNotebookFill } from "react-icons/pi";
import { WidgetCard } from "../common/WidgetCard";
import { formatRelativeDate } from "../../utils/formatters";
import type { Note, NoteFolder } from "../../types";

interface NotesWidgetProps {
  notes: Note[];
  loading?: boolean;
  folders: Record<string, NoteFolder>;
  onOpen?: () => void;
  disabled?: boolean;
}

export const NotesWidget = ({ notes, loading, folders, onOpen, disabled = false }: NotesWidgetProps) => {
  const principalesNotes = notes.slice(0, 3); // Modification : limiter l'aperçu pour alléger la hauteur du widget.

  return (
    <WidgetCard
      titre="Notes"
      description="Mises à jour récentes"
      icone={<PiNotebookFill size={24} />}
      accent="rouge"
      onClick={onOpen}
      disabled={disabled}
    >
      {loading ? (
        <p className="widget-card__empty">Chargement…</p>
      ) : principalesNotes.length === 0 ? (
        <p className="widget-card__empty">Aucune note pour le moment.</p>
      ) : (
        <ul className="widget-list">
          {principalesNotes.map((note) => {
            const tags = note.etiquettes?.slice(0, 2) ?? [];
            const remainingTags = (note.etiquettes?.length ?? 0) - tags.length;
            return (
              <li key={note.id}>
                <div className="widget-list__main">
                  <p className="widget-list__title">{note.titre}</p>
                  <span className="widget-list__meta">
                    {folders[note.dossierId]?.nom ?? "Notes"} · {formatRelativeDate(note.misAJourLe)}
                  </span>
                </div>
                {note.etiquettes && note.etiquettes.length > 0 && (
                  <div className="widget-list__tags">
                    {tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                    {remainingTags > 0 && <span>+{remainingTags}</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
};
