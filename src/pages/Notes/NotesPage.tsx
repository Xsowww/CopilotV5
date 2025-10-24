import { useEffect, useMemo, useState } from "react";
import type { Note } from "../../types";
import { mockApi } from "../../services/mockApi";
import { formatRelativeDate } from "../../utils/formatters";

export const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selection, setSelection] = useState<string | null>(null);

  useEffect(() => {
    mockApi.fetchNotes().then((data) => {
      setNotes(data);
      setSelection(data[0]?.id ?? null);
    });
  }, []);

  const noteActive = useMemo(
    () => notes.find((note) => note.id === selection) ?? null,
    [notes, selection]
  );

  const dossiers = useMemo(() => {
    const grouped = new Map<string, Note[]>();
    notes.forEach((note) => {
      if (!grouped.has(note.dossier)) {
        grouped.set(note.dossier, []);
      }
      grouped.get(note.dossier)?.push(note);
    });
    return Array.from(grouped.entries());
  }, [notes]);

  return (
    <div className="notes-page">
      <aside className="notes-page__sidebar">
        <header>
          <h2>Notes</h2>
          <p>{notes.length} notes synchronisées</p>
        </header>
        <nav>
          {dossiers.map(([dossier, notesDuDossier]) => (
            <div key={dossier} className="notes-page__folder">
              <h3>{dossier}</h3>
              <ul>
                {notesDuDossier.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      className={
                        selection === note.id
                          ? "notes-page__item notes-page__item--active"
                          : "notes-page__item"
                      }
                      onClick={() => setSelection(note.id)}
                    >
                      <span>{note.titre}</span>
                      <small>{formatRelativeDate(note.misAJourLe)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <section className="notes-page__content">
        {noteActive ? (
          <article>
            <header>
              <h3>{noteActive.titre}</h3>
              <p>Dernière modification : {formatRelativeDate(noteActive.misAJourLe)}</p>
            </header>
            <pre>{noteActive.contenu}</pre>
            {noteActive.etiquettes && noteActive.etiquettes.length > 0 && (
              <div className="notes-page__tags">
                {noteActive.etiquettes.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </article>
        ) : (
          <p className="widget-card__empty">Sélectionne une note pour commencer.</p>
        )}
      </section>
    </div>
  );
};
