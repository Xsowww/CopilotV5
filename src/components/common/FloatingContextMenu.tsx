import {
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
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
  setState,
  role = "menu",
  className = "context-menu",
  children,
}: PropsWithChildren<FloatingContextMenuProps<Payload>>) => {
  const ref = useRef<HTMLUListElement | null>(null);

  useLayoutEffect(() => {
    if (!state.visible || !ref.current) {
      return;
    }
    const element = ref.current;
    const padding = 12;
    const { offsetWidth, offsetHeight } = element;
    let nextX = state.x;
    let nextY = state.y;
    const maxX = Math.max(padding, window.innerWidth - offsetWidth - padding);
    const maxY = Math.max(padding, window.innerHeight - offsetHeight - padding);
    nextX = Math.min(Math.max(padding, nextX), maxX);
    nextY = Math.min(Math.max(padding, nextY), maxY);
    if (nextX !== state.x || nextY !== state.y) {
      // Ajustement : réaligner le menu sur la zone visible sans perdre la cible initiale.
      setState((prev) => ({ ...prev, x: nextX, y: nextY }));
    }
  }, [setState, state]);

  useEffect(() => {
    if (!state.visible) {
      return;
    }
    const handleResize = () => {
      const padding = 12;
      setState((prev) => {
        const element = ref.current;
        if (!element) {
          return prev;
        }
        const { offsetWidth, offsetHeight } = element;
        const maxX = Math.max(padding, window.innerWidth - offsetWidth - padding);
        const maxY = Math.max(padding, window.innerHeight - offsetHeight - padding);
        return {
          ...prev,
          x: Math.min(Math.max(padding, prev.x), maxX),
          y: Math.min(Math.max(padding, prev.y), maxY),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [setState, state.visible]);

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
