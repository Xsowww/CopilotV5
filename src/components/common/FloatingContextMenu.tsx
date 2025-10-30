import {
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import type { ContextMenuState } from "../../hooks/useContextMenu";

interface FloatingContextMenuProps<Payload> {
  state: ContextMenuState<Payload>;
  setState: Dispatch<SetStateAction<ContextMenuState<Payload>>>;
  role?: string;
  className?: string;
}

/**
 * Composant portail pour assurer que les menus contextuels s'ouvrent exactement au point de clic
 * tout en restant dans la fenêtre (correctif suite au décalage observé par l'utilisateur).
 */
export const FloatingContextMenu = <Payload,>({
  state,
  setState: _setState,
  role = "menu",
  className = "context-menu",
  children,
}: PropsWithChildren<FloatingContextMenuProps<Payload>>) => {
  const ref = useRef<HTMLUListElement | null>(null);

  const applyOffsets = useCallback(() => {
    const element = ref.current;
    if (!state.visible || !element) {
      return;
    }
    const padding = 4;
    const { offsetWidth, offsetHeight } = element;
    const maxX = Math.max(padding, window.innerWidth - offsetWidth - padding);
    const maxY = Math.max(padding, window.innerHeight - offsetHeight - padding);
    const nextX = Math.min(Math.max(padding, state.x), maxX);
    const nextY = Math.min(Math.max(padding, state.y), maxY);
    // Correctif : applique un décalage CSS sans déplacer le point d'ancrage initial du clic droit.
    element.style.setProperty("--menu-offset-x", `${nextX - state.x}px`);
    element.style.setProperty("--menu-offset-y", `${nextY - state.y}px`);
  }, [state]);

  useLayoutEffect(() => {
    if (!state.visible) {
      return;
    }
    applyOffsets();
    return () => {
      const element = ref.current;
      if (element) {
        element.style.removeProperty("--menu-offset-x");
        element.style.removeProperty("--menu-offset-y");
      }
    };
  }, [applyOffsets, state.visible]);

  useEffect(() => {
    if (!state.visible) {
      return;
    }
    const handleResize = () => {
      applyOffsets();
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [applyOffsets, state.visible]);

  if (!state.visible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <ul ref={ref} className={className} style={{ top: state.y, left: state.x }} role={role}>
      {children}
    </ul>,
    document.body
  );
};
