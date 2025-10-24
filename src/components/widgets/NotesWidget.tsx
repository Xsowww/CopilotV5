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
  const principalesNotes = notes.slice(0, 4);

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
        <ul className="notes-widget">
          {principalesNotes.map((note) => (
            <li key={note.id}>
              <div>
                <p className="notes-widget__title">{note.titre}</p>
                <span className="notes-widget__meta">
                  {folders[note.dossierId]?.nom ?? "Notes"} · {formatRelativeDate(note.misAJourLe)}
                </span>
              </div>
              {note.etiquettes && note.etiquettes.length > 0 && (
                <div className="notes-widget__tags">
                  {note.etiquettes.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};
