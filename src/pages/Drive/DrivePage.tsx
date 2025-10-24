import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PiArrowArcLeftBold,
  PiCloudArrowUpFill,
  PiDotsThreeOutlineFill,
  PiFolderPlusFill,
} from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../../context/AppDataContext";
import { ActionDialog } from "../../components/common/ActionDialog";
import { DrivePreview } from "../../components/drive/DrivePreview";
import type { DriveFileNode, DriveFolderNode, DriveNode } from "../../types";
import { formatRelativeDate, formatWeight } from "../../utils/formatters";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
}

const initialMenuState: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  targetId: null,
};

const isFolder = (node: DriveNode | undefined): node is DriveFolderNode =>
  Boolean(node && node.type === "dossier");

type DriveDialogState =
  | { open: false }
  | { open: true; type: "create"; parentId: string }
  | { open: true; type: "import"; parentId: string }
  | { open: true; type: "rename"; nodeId: string }
  | { open: true; type: "delete"; nodeId: string }
  | { open: true; type: "move"; nodeId: string };

export const DrivePage = () => {
  const {
    drive,
    createDriveFolder,
    uploadDriveFiles,
    renameDriveNode,
    deleteDriveNode,
    moveDriveNode,
    copyDriveNode,
    cutDriveNode,
    pasteClipboard,
    updateDriveFile,
    clipboard,
  } = useAppData();

  const [currentFolderId, setCurrentFolderId] = useState(drive.rootId);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(initialMenuState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dialog, setDialog] = useState<DriveDialogState>({ open: false });
  const [dialogValue, setDialogValue] = useState("");
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = () => setContextMenu(initialMenuState);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(initialMenuState);
      }
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    const state = location.state as { focusDriveId?: string; focusDriveType?: DriveNode["type"] } | null;
    if (!state?.focusDriveId) {
      return;
    }

    const node = drive.nodes[state.focusDriveId];
    if (node) {
      // Modification : ouverture automatique d'un élément Drive ciblé depuis le tableau de bord.
      if (node.type === "dossier") {
        setCurrentFolderId(node.id);
      } else {
        setCurrentFolderId(node.parentId ?? drive.rootId);
        setPreviewId(node.id);
      }
    }
    navigate(".", { replace: true, state: null });
  }, [location.state, drive.nodes, drive.rootId, navigate]);

  const currentFolder = drive.nodes[currentFolderId] as DriveFolderNode;

  const breadcrumb = useMemo(() => {
    const trail: DriveFolderNode[] = [];
    let pointer: DriveNode | undefined = currentFolder;
    while (pointer && pointer.type === "dossier") {
      trail.unshift(pointer);
      pointer = pointer.parentId ? drive.nodes[pointer.parentId] : undefined;
    }
    return trail;
  }, [currentFolder, drive.nodes]);

  useEffect(() => {
    if (!isFolder(currentFolder)) {
      setCurrentFolderId(drive.rootId);
    }
  }, [currentFolder, drive.rootId]);

  const items = useMemo(() => {
    if (!isFolder(currentFolder)) return [];
    const children = currentFolder.enfants
      .map((id) => drive.nodes[id])
      .filter(Boolean) as DriveNode[];
    return children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "dossier" ? -1 : 1;
      }
      return b.misAJourLe.localeCompare(a.misAJourLe);
    });
  }, [currentFolder, drive.nodes]);

  const allFolders = useMemo(() => {
    return Object.values(drive.nodes).filter((node): node is DriveFolderNode => node.type === "dossier");
  }, [drive.nodes]);

  const getDescendantIds = useCallback(
    (folderId: string) => {
      const ids = new Set<string>();
      const visit = (id: string) => {
        const node = drive.nodes[id];
        if (!node || node.type !== "dossier") return;
        node.enfants.forEach((childId) => {
          ids.add(childId);
          visit(childId);
        });
      };
      visit(folderId);
      return ids;
    },
    [drive.nodes]
  );

  const showDialog = (state: DriveDialogState) => {
    setDialog(state);
    setContextMenu(initialMenuState);
  };

  const closeDialog = () => {
    setDialog({ open: false });
    setDialogValue("");
    setMoveTarget("");
  };

  useEffect(() => {
    if (!dialog.open) {
      setDialogValue("");
      return;
    }
    if (dialog.type === "rename") {
      const node = drive.nodes[dialog.nodeId];
      setDialogValue(node?.nom ?? "");
    }
    if (dialog.type === "create" || dialog.type === "import") {
      setDialogValue("");
    }
    if (dialog.type === "move") {
      const node = drive.nodes[dialog.nodeId];
      const candidate = node?.parentId ?? currentFolderId;
      const forbidden = getDescendantIds(dialog.nodeId);
      forbidden.add(dialog.nodeId);
      const allowedTargets = allFolders.map((folder) => folder.id).filter((id) => !forbidden.has(id));
      if (candidate && allowedTargets.includes(candidate)) {
        setMoveTarget(candidate);
      } else {
        setMoveTarget(allowedTargets[0] ?? "");
      }
    }
  }, [dialog, currentFolderId, allFolders, getDescendantIds, drive.nodes]);

  const handleOpenNode = (node: DriveNode) => {
    if (node.type === "dossier") {
      setCurrentFolderId(node.id);
    } else {
      setPreviewId(node.id);
    }
  };

  const handleCreateFolder = () => {
    showDialog({ open: true, type: "create", parentId: currentFolderId });
  };

  const handleImportFolder = () => {
    showDialog({ open: true, type: "import", parentId: currentFolderId });
  };

  const handleRename = (nodeId: string) => {
    showDialog({ open: true, type: "rename", nodeId });
  };

  const handleDelete = (nodeId: string) => {
    showDialog({ open: true, type: "delete", nodeId });
  };

  const handleMove = (nodeId: string) => {
    showDialog({ open: true, type: "move", nodeId });
  };

  const handleCopy = (nodeId: string) => {
    copyDriveNode(nodeId);
    setContextMenu(initialMenuState);
  };

  const handleCut = (nodeId: string) => {
    cutDriveNode(nodeId);
    setContextMenu(initialMenuState);
  };

  const handlePaste = (targetId: string) => {
    pasteClipboard(targetId);
    setContextMenu(initialMenuState);
  };

  const openContextMenu = (event: React.MouseEvent, nodeId: string | null) => {
    event.preventDefault();
    event.stopPropagation();
    const padding = 12;
    const estimatedWidth = 220;
    const estimatedHeight = 260;
    const clampedX = Math.max(padding, Math.min(event.clientX, window.innerWidth - estimatedWidth));
    const clampedY = Math.max(padding, Math.min(event.clientY, window.innerHeight - estimatedHeight));
    setContextMenu({
      visible: true,
      x: clampedX,
      y: clampedY,
      targetId: nodeId,
    });
  };

  const handleUploadFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadDriveFiles(currentFolderId, Array.from(files));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const previewFile = useMemo(() => {
    if (!previewId) return null;
    const node = drive.nodes[previewId];
    return node && node.type === "fichier" ? (node as DriveFileNode) : null;
  }, [drive.nodes, previewId]);

  const moveForbiddenTargets = useMemo(() => {
    if (!(dialog.open && dialog.type === "move")) {
      return new Set<string>();
    }
    const ids = getDescendantIds(dialog.nodeId);
    ids.add(dialog.nodeId);
    return ids;
  }, [dialog, getDescendantIds]);

  return (
    <div className="drive-page" onContextMenu={(event) => openContextMenu(event, null)}>
      <header className="drive-page__header">
        <div>
          <h2>Drive</h2>
          <p>Gère tes dossiers et fichiers comme sur iCloud.</p>
          <nav className="drive-breadcrumb">
            {breadcrumb.map((folder, index) => (
              <button
                key={folder.id}
                type="button"
                className="drive-breadcrumb__item"
                onClick={() => setCurrentFolderId(folder.id)}
                disabled={index === breadcrumb.length - 1}
              >
                {folder.nom}
              </button>
            ))}
          </nav>
        </div>
        <div className="drive-page__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => currentFolder.parentId && setCurrentFolderId(currentFolder.parentId)}
            disabled={!currentFolder.parentId}
          >
            <PiArrowArcLeftBold size={16} /> Revenir
          </button>
          <button type="button" className="btn-secondary" onClick={handleCreateFolder}>
            <PiFolderPlusFill size={16} /> Nouveau dossier
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <PiCloudArrowUpFill size={16} /> Importer fichier
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleImportFolder}
          >
            <PiDotsThreeOutlineFill size={16} /> Importer dossier
          </button>
          {clipboard.elementId && (
            <button type="button" className="btn-primary" onClick={() => handlePaste(currentFolderId)}>
              Coller dans ce dossier
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={(event) => handleUploadFiles(event.target.files)}
          />
        </div>
      </header>

      <div className="drive-table" role="grid">
        <div className="drive-table__header" role="row">
          <span>Nom</span>
          <span>Type</span>
          <span>Dernière modification</span>
          <span>Taille/Partage</span>
        </div>
        <div className="drive-table__body">
          {items.length === 0 ? (
            <p className="widget-card__empty">Ce dossier est vide. Crée un dossier ou importe un fichier.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="drive-table__row"
                role="row"
                onDoubleClick={() => handleOpenNode(item)}
                onContextMenu={(event) => openContextMenu(event, item.id)}
                onClick={() => item.type === "dossier" && handleOpenNode(item)}
              >
                <span>{item.nom}</span>
                <span>{item.type === "dossier" ? "Dossier" : item.extension.toUpperCase()}</span>
                <span>{formatRelativeDate(item.misAJourLe)}</span>
                <span>
                  {item.type === "fichier"
                    ? formatWeight((item as DriveFileNode).poidsMo)
                    : item.partage
                      ? "Partagé"
                      : "Privé"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {contextMenu.visible && (
        <ul
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          role="menu"
        >
          {contextMenu.targetId && (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const node = contextMenu.targetId ? drive.nodes[contextMenu.targetId] : null;
                    if (node) {
                      handleOpenNode(node);
                    }
                    setContextMenu(initialMenuState);
                  }}
                >
                  Ouvrir
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleRename(contextMenu.targetId!)}>
                  Renommer
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleMove(contextMenu.targetId!)}>
                  Déplacer…
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleCopy(contextMenu.targetId!)}>
                  Copier
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleCut(contextMenu.targetId!)}>
                  Couper
                </button>
              </li>
              {clipboard.elementId && (
                <li>
                  <button type="button" onClick={() => handlePaste(contextMenu.targetId!)}>
                    Coller ici
                  </button>
                </li>
              )}
              <li>
                <button type="button" onClick={() => handleDelete(contextMenu.targetId!)}>
                  Supprimer
                </button>
              </li>
            </>
          )}
          {!contextMenu.targetId && clipboard.elementId && (
            <li>
              <button type="button" onClick={() => handlePaste(currentFolderId)}>
                Coller dans {currentFolder.nom}
              </button>
            </li>
          )}
          {!contextMenu.targetId && (
            <li>
              <button type="button" onClick={handleCreateFolder}>
                Nouveau dossier
              </button>
            </li>
          )}
        </ul>
      )}

      {/* Mise à jour : flux de gestion des dossiers via une modale cohérente */}
      <ActionDialog
        open={
          dialog.open &&
          (dialog.type === "create" || dialog.type === "import" || dialog.type === "rename")
        }
        title={
          dialog.open && dialog.type === "rename"
            ? "Renommer l'élément"
            : dialog.open && dialog.type === "import"
              ? "Importer un dossier"
              : "Nouveau dossier"
        }
        confirmLabel={
          dialog.open && dialog.type === "rename"
            ? "Renommer"
            : dialog.open && dialog.type === "import"
              ? "Importer"
              : "Créer"
        }
        onClose={closeDialog}
        onConfirm={() => {
          if (!dialog.open) return;
          const value = dialogValue.trim();
          if (!value) return;
          if (dialog.type === "create" || dialog.type === "import") {
            createDriveFolder(dialog.parentId, value);
          }
          if (dialog.type === "rename") {
            renameDriveNode(dialog.nodeId, value);
          }
          closeDialog();
        }}
        confirmDisabled={!dialogValue.trim()}
      >
        <label className="dialog-field">
          <span>Nom</span>
          <input
            value={dialogValue}
            onChange={(event) => setDialogValue(event.target.value)}
            placeholder="Nom du dossier"
          />
        </label>
      </ActionDialog>

      {/* Mise à jour : confirmation interne pour les suppressions */}
      <ActionDialog
        open={dialog.open && dialog.type === "delete"}
        title="Supprimer l'élément"
        description="Confirme la suppression. Cette action est immédiate dans la démonstration."
        confirmLabel="Supprimer"
        onClose={closeDialog}
        onConfirm={() => {
          if (!dialog.open || dialog.type !== "delete") return;
          deleteDriveNode(dialog.nodeId);
          closeDialog();
        }}
      />

      {/* Mise à jour : déplacement avec sélection guidée */}
      <ActionDialog
        open={dialog.open && dialog.type === "move"}
        title="Déplacer dans un dossier"
        confirmLabel="Déplacer"
        onClose={closeDialog}
        onConfirm={() => {
          if (!dialog.open || dialog.type !== "move" || !moveTarget) return;
          moveDriveNode(dialog.nodeId, moveTarget);
          closeDialog();
        }}
        confirmDisabled={
          !(dialog.open && dialog.type === "move") || !moveTarget || moveForbiddenTargets.has(moveTarget)
        }
      >
        {dialog.open && dialog.type === "move" ? (
          <label className="dialog-field">
            <span>Destination</span>
            <select value={moveTarget} onChange={(event) => setMoveTarget(event.target.value)}>
              {allFolders
                .filter((folder) => {
                  if (!dialog.open || dialog.type !== "move") return true;
                  return !moveForbiddenTargets.has(folder.id);
                })
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.nom}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
      </ActionDialog>

      <DrivePreview
        file={previewFile}
        onClose={() => setPreviewId(null)}
        onSaveDocument={(nodeId, content) => updateDriveFile(nodeId, { contenuTexte: content })}
      />
    </div>
  );
};
