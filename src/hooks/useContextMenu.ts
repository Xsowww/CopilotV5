import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useState } from "react";

export interface ContextMenuState<Payload> {
  visible: boolean;
  x: number;
  y: number;
  payload: Payload | null;
}

const DEFAULT_STATE = { visible: false, x: 0, y: 0, payload: null } as const;

/**
 * Hook utilitaire centralisant l'ouverture/fermeture des menus contextuels.
 * Il permet de conserver un comportement homogène sur toutes les pages suite aux retours utilisateurs.
 */
export const useContextMenu = <Payload,>() => {
  const [state, setState] = useState<ContextMenuState<Payload>>(DEFAULT_STATE);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const open = useCallback((event: ReactMouseEvent, payload: Payload) => {
    event.preventDefault();
    event.stopPropagation();
    const x = event.clientX;
    const y = event.clientY;
    // Ajustement : mémoriser la position réelle du clic avant repositionnement côté portail.
    setState({ visible: true, x, y, payload });
  }, []);

  useEffect(() => {
    if (!state.visible) {
      return;
    }

    const handleGlobalClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement)?.closest?.(".context-menu")) {
        close();
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("contextmenu", handleGlobalClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("contextmenu", handleGlobalClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [close, state.visible]);

  return { state, open, close, setState } as const;
};
