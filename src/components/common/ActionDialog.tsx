import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface ActionDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmDisabled?: boolean;
}

const isDomReady = typeof document !== "undefined";

export const ActionDialog = ({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Annuler",
  onConfirm,
  onClose,
  confirmDisabled = false,
}: ActionDialogProps) => {
  if (!open || !isDomReady) return null;

  // Mise à jour : modale unifiée pour remplacer les alertes et prompts natifs
  return createPortal(
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog-card__header">
          <h3 id="dialog-title">{title}</h3>
        </header>
        {description && <p className="dialog-card__description">{description}</p>}
        {children && <div className="dialog-card__body">{children}</div>}
        <footer className="dialog-card__footer">
          <button type="button" className="btn-tertiary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};
