import { useEffect, useMemo, useRef, useState } from "react";
import {
  PiArrowArcLeftBold,
  PiCloudArrowUpFill,
  PiDotsThreeOutlineFill,
  PiFolderPlusFill,
} from "react-icons/pi";
import { useAppData } from "../../context/AppDataContext";
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
    clipboard,
  } = useAppData();

  const [currentFolderId, setCurrentFolderId] = useState(drive.rootId);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(initialMenuState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleOpenFolder = (node: DriveNode) => {
    if (node.type === "dossier") {
      setCurrentFolderId(node.id);
    }
  };

  const handleCreateFolder = () => {
    const nom = window.prompt("Nom du nouveau dossier");
    if (nom) {
      createDriveFolder(currentFolderId, nom.trim());
    }
  };

  const handleRename = (nodeId: string) => {
    const node = drive.nodes[nodeId];
    if (!node) return;
    const nom = window.prompt("Renommer l'élément", node.nom);
    if (nom && nom.trim()) {
      renameDriveNode(nodeId, nom.trim());
    }
    setContextMenu(initialMenuState);
  };

  const handleDelete = (nodeId: string) => {
    const node = drive.nodes[nodeId];
    if (!node) return;
    if (window.confirm(`Supprimer "${node.nom}" ?`)) {
      deleteDriveNode(nodeId);
    }
    setContextMenu(initialMenuState);
  };

  const allFolders = useMemo(() => {
    return Object.values(drive.nodes).filter((node): node is DriveFolderNode => node.type === "dossier");
  }, [drive.nodes]);

  const handleMove = (nodeId: string) => {
    const destinations = allFolders.filter((folder) => folder.id !== nodeId);
    const selection = window.prompt(
      `Déplacer dans quel dossier ?\n${destinations
        .map((folder) => `- ${folder.nom}`)
        .join("\n")}`,
      currentFolder.nom
    );
    if (!selection) return;
    const target = destinations.find((folder) => folder.nom.toLowerCase() === selection.toLowerCase());
    if (target) {
      moveDriveNode(nodeId, target.id);
    } else {
      window.alert("Dossier introuvable. Merci de saisir le nom exact.");
    }
    setContextMenu(initialMenuState);
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
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
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
            onClick={() => {
              const nom = window.prompt("Nom du dossier à importer");
              if (nom) {
                createDriveFolder(currentFolderId, nom.trim());
              }
            }}
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
                onDoubleClick={() => handleOpenFolder(item)}
                onContextMenu={(event) => openContextMenu(event, item.id)}
                onClick={() => item.type === "dossier" && handleOpenFolder(item)}
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
    </div>
  );
};
