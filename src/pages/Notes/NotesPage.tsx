import { useEffect, useMemo, useState } from "react";
import { PiNotePencilFill, PiPlusBold, PiTrashFill } from "react-icons/pi";
import { useAppData } from "../../context/AppDataContext";
import type { Note, NoteFolder } from "../../types";
import { formatRelativeDate } from "../../utils/formatters";

interface FolderTreeItem extends NoteFolder {
  depth: number;
}

const buildFolderTree = (folders: Record<string, NoteFolder>, parentId: string | null = null, depth = 0): FolderTreeItem[] => {
  return Object.values(folders)
    .filter((folder) => folder.parentId === parentId)
    .sort((a, b) => a.nom.localeCompare(b.nom))
    .flatMap((folder) => [
      { ...folder, depth },
      ...buildFolderTree(folders, folder.id, depth + 1),
    ]);
};

export const NotesPage = () => {
  const { notes, createNoteFolder, renameNoteFolder, createNote, updateNote, deleteNote, moveNote } = useAppData();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    const firstFolder = Object.values(notes.folders).find((folder) => folder.parentId === "note-root");
    if (firstFolder && !selectedFolderId) {
      setSelectedFolderId(firstFolder.id);
    }
  }, [notes.folders, selectedFolderId]);

  const folderTree = useMemo(() => buildFolderTree(notes.folders, "note-root"), [notes.folders]);

  const notesForFolder = useMemo(() => {
    if (!selectedFolderId) return [];
    return Object.values(notes.notes)
      .filter((note) => note.dossierId === selectedFolderId)
      .sort((a, b) => b.misAJourLe.localeCompare(a.misAJourLe));
  }, [notes.notes, selectedFolderId]);

  useEffect(() => {
    if (notesForFolder.length > 0) {
      setSelectedNoteId((prev) => prev ?? notesForFolder[0].id);
    } else {
      setSelectedNoteId(null);
    }
  }, [notesForFolder]);

  const currentNote: Note | null = selectedNoteId ? notes.notes[selectedNoteId] ?? null : null;

  const handleCreateFolder = () => {
    if (!selectedFolderId) return;
    const nom = window.prompt("Nom du nouveau dossier");
    if (nom) {
      const newId = createNoteFolder(selectedFolderId, nom.trim());
      setSelectedFolderId(newId);
      setSelectedNoteId(null);
    }
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    const nom = window.prompt("Renommer le dossier", currentName);
    if (nom && nom.trim()) {
      renameNoteFolder(folderId, nom.trim());
    }
  };

  const handleCreateNote = () => {
    if (!selectedFolderId) return;
    const newId = createNote({ dossierId: selectedFolderId });
    setSelectedNoteId(newId);
  };

  const handleDeleteNote = () => {
    if (!currentNote) return;
    if (window.confirm("Supprimer cette note ?")) {
      deleteNote(currentNote.id);
      setSelectedNoteId(null);
    }
  };

  return (
    <div className="notes-page">
      <aside className="notes-page__sidebar" onContextMenu={(event) => event.preventDefault()}>
        <header>
          <h2>Notes</h2>
          <button type="button" className="btn-secondary" onClick={handleCreateFolder} disabled={!selectedFolderId}>
            <PiPlusBold size={14} /> Nouveau dossier
          </button>
        </header>
        <nav>
          {folderTree.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={
                selectedFolderId === folder.id ? "notes-page__folder-button notes-page__folder-button--active" : "notes-page__folder-button"
              }
              style={{ paddingLeft: `${folder.depth * 16 + 12}px` }}
              onClick={() => {
                setSelectedFolderId(folder.id);
              }}
              onDoubleClick={() => handleRenameFolder(folder.id, folder.nom)}
            >
              <span>{folder.nom}</span>
              {folder.id !== "note-root" && <small>{Object.values(notes.notes).filter((note) => note.dossierId === folder.id).length}</small>}
            </button>
          ))}
        </nav>
      </aside>

      <section className="notes-page__list">
        <header>
          <h3>{selectedFolderId ? notes.folders[selectedFolderId]?.nom : ""}</h3>
          <button type="button" className="btn-primary" onClick={handleCreateNote} disabled={!selectedFolderId}>
            <PiNotePencilFill size={16} /> Nouvelle note
          </button>
        </header>
        <div className="notes-page__list-items">
          {notesForFolder.length === 0 ? (
            <p className="widget-card__empty">Aucune note dans ce dossier.</p>
          ) : (
            <ul>
              {notesForFolder.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={note.id === selectedNoteId ? "notes-page__item notes-page__item--active" : "notes-page__item"}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <div>
                      <strong>{note.titre}</strong>
                      <span>{note.contenu.slice(0, 80) || "Commence à écrire…"}</span>
                    </div>
                    <small>{formatRelativeDate(note.misAJourLe)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="notes-page__content">
        {!currentNote ? (
          <p className="widget-card__empty">Sélectionne une note pour commencer.</p>
        ) : (
          <div className="notes-editor">
            <header>
              <input
                className="notes-editor__title"
                value={currentNote.titre}
                onChange={(event) => updateNote(currentNote.id, currentNote.contenu, event.target.value)}
              />
              <div className="notes-editor__meta">
                <span>Modifiée {formatRelativeDate(currentNote.misAJourLe)}</span>
                <select
                  value={currentNote.dossierId}
                  onChange={(event) => moveNote(currentNote.id, event.target.value)}
                >
                  {folderTree.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.nom}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-tertiary" onClick={handleDeleteNote}>
                  <PiTrashFill size={16} /> Supprimer
                </button>
              </div>
            </header>
            <textarea
              className="notes-editor__textarea"
              value={currentNote.contenu}
              onChange={(event) => updateNote(currentNote.id, event.target.value)}
            />
          </div>
        )}
      </section>
    </div>
  );
};
