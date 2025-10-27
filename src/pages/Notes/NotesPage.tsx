import { useEffect, useMemo, useState } from "react";
import { PiNotePencilFill, PiPlusBold, PiTrashFill } from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../../context/AppDataContext";
import { ActionDialog } from "../../components/common/ActionDialog";
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

type NotesDialogState =
  | { open: false }
  | { open: true; type: "create-folder"; parentId: string }
  | { open: true; type: "rename-folder"; folderId: string }
  | { open: true; type: "delete-note"; noteId: string };

export const NotesPage = () => {
  const { notes, createNoteFolder, renameNoteFolder, createNote, updateNote, deleteNote, moveNote } = useAppData();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<NotesDialogState>({ open: false });
  const [dialogValue, setDialogValue] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const folderTree = useMemo(() => buildFolderTree(notes.folders, null), [notes.folders]);
  const rootFolderId = useMemo(
    () => folderTree.find((folder) => folder.parentId === null)?.id ?? null,
    [folderTree]
  );

  useEffect(() => {
    if (!selectedFolderId && rootFolderId) {
      // Correctif : sélectionner automatiquement le dossier racine pour réactiver les actions.
      setSelectedFolderId(rootFolderId);
    }
  }, [rootFolderId, selectedFolderId]);

  useEffect(() => {
    const state = location.state as { focusNoteId?: string } | null;
    if (!state?.focusNoteId) {
      return;
    }
    const note = notes.notes[state.focusNoteId];
    if (note) {
      // Modification : sélection automatique d'une note ciblée depuis le tableau de bord.
      setSelectedFolderId(note.dossierId);
      setSelectedNoteId(note.id);
    }
    navigate(".", { replace: true, state: null });
  }, [location.state, notes.notes, navigate]);

  useEffect(() => {
    if (!dialog.open) {
      setDialogValue("");
      return;
    }
    if (dialog.type === "rename-folder") {
      setDialogValue(notes.folders[dialog.folderId]?.nom ?? "");
    }
    if (dialog.type === "create-folder") {
      setDialogValue("");
    }
  }, [dialog, notes.folders]);

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

  const closeDialog = () => {
    setDialog({ open: false });
    setDialogValue("");
  };

  const isFolderDialog = dialog.open && (dialog.type === "create-folder" || dialog.type === "rename-folder");
  const isDeleteNoteDialog = dialog.open && dialog.type === "delete-note";

  const handleCreateFolder = () => {
    if (!selectedFolderId) return;
    setDialog({ open: true, type: "create-folder", parentId: selectedFolderId });
  };

  const handleRenameFolder = (folderId: string) => {
    setDialog({ open: true, type: "rename-folder", folderId });
  };

  const handleCreateNote = () => {
    if (!selectedFolderId) return;
    const newId = createNote({ dossierId: selectedFolderId });
    setSelectedNoteId(newId);
  };

  const handleDeleteNote = () => {
    if (!currentNote) return;
    setDialog({ open: true, type: "delete-note", noteId: currentNote.id });
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
              onDoubleClick={() => handleRenameFolder(folder.id)}
            >
              <span>{folder.nom}</span>
              {folder.id !== rootFolderId && (
                <small>{Object.values(notes.notes).filter((note) => note.dossierId === folder.id).length}</small>
              )}
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

      {/* Mise à jour : modales internes pour dossiers et notes */}
      <ActionDialog
        open={isFolderDialog}
        title={dialog.open && dialog.type === "rename-folder" ? "Renommer le dossier" : "Nouveau dossier"}
        confirmLabel={dialog.open && dialog.type === "rename-folder" ? "Renommer" : "Créer"}
        onClose={closeDialog}
        onConfirm={() => {
          if (!dialog.open) return;
          const value = dialogValue.trim();
          if (!value) return;
          if (dialog.type === "create-folder") {
            const newId = createNoteFolder(dialog.parentId, value);
            setSelectedFolderId(newId);
            setSelectedNoteId(null);
          }
          if (dialog.type === "rename-folder") {
            renameNoteFolder(dialog.folderId, value);
          }
          closeDialog();
        }}
        confirmDisabled={!dialogValue.trim()}
      >
        <label className="dialog-field">
          <span>Nom du dossier</span>
          <input
            value={dialogValue}
            onChange={(event) => setDialogValue(event.target.value)}
            placeholder="Donne un nom à ton dossier"
          />
        </label>
      </ActionDialog>

      <ActionDialog
        open={isDeleteNoteDialog}
        title="Supprimer la note"
        description="La note sera retirée de la démonstration Copilot."
        confirmLabel="Supprimer"
        onClose={closeDialog}
        onConfirm={() => {
          if (!dialog.open || dialog.type !== "delete-note") return;
          deleteNote(dialog.noteId);
          if (selectedNoteId === dialog.noteId) {
            setSelectedNoteId(null);
          }
          closeDialog();
        }}
      />
    </div>
  );
};
