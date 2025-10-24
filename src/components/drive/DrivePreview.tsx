import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DriveFileNode } from "../../types";

interface DrivePreviewProps {
  file: DriveFileNode | null;
  onClose: () => void;
  onSaveDocument: (nodeId: string, content: string) => void;
}

const isDomReady = typeof document !== "undefined";

export const DrivePreview = ({ file, onClose, onSaveDocument }: DrivePreviewProps) => {
  const [localContent, setLocalContent] = useState<string>("");

  useEffect(() => {
    setLocalContent(file?.contenuTexte ?? "");
  }, [file?.id, file?.contenuTexte]);

  if (!file || !isDomReady) return null;

  const handleSave = () => {
    if (!file || (file.apercuType !== "document" && file.apercuType !== "texte")) return;
    onSaveDocument(file.id, localContent);
  };

  const renderPreview = () => {
    switch (file.apercuType) {
      case "image":
        return <img src={file.apercuUrl} alt={file.nom} className="drive-preview__media" />;
      case "pdf":
        return (
          <iframe
            title={`Prévisualisation de ${file.nom}`}
            src={file.apercuUrl}
            className="drive-preview__iframe"
          />
        );
      case "document":
      case "texte":
        return (
          <div className="drive-preview__editor">
            <textarea
              value={localContent}
              onChange={(event) => setLocalContent(event.target.value)}
              placeholder="Commence à modifier ton document ici…"
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={localContent === (file.contenuTexte ?? "")}
            >
              Enregistrer les modifications
            </button>
          </div>
        );
      default:
        return (
          <p className="drive-preview__empty">
            Prévisualisation indisponible pour ce format. Télécharge ou convertis le fichier pour le consulter.
          </p>
        );
    }
  };

  // Mise à jour : aperçu immersif pour les fichiers importés
  return createPortal(
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="drive-preview"
        role="dialog"
        aria-modal="true"
        aria-label={`Prévisualisation du fichier ${file.nom}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drive-preview__header">
          <div>
            <h3>{file.nom}</h3>
            <span>{file.extension.toUpperCase()}</span>
          </div>
          <button type="button" className="btn-tertiary" onClick={onClose}>
            Fermer
          </button>
        </header>
        <div className="drive-preview__content">{renderPreview()}</div>
      </div>
    </div>,
    document.body
  );
};
