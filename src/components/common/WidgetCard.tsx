import { clsx } from "clsx";
import type { KeyboardEvent, PropsWithChildren, ReactNode } from "react";

export type WidgetAccent = "bleu" | "jaune" | "rouge" | "vert";

interface WidgetCardProps {
  titre: string;
  description?: string;
  icone?: ReactNode;
  accent?: WidgetAccent;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const WidgetCard = ({
  titre,
  description,
  icone,
  actions,
  accent = "bleu",
  className,
  onClick,
  disabled = false,
  children,
}: PropsWithChildren<WidgetCardProps>) => {
  const interactive = Boolean(onClick) && !disabled;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <section
      className={clsx("widget-card", className, {
        "widget-card--interactive": Boolean(onClick),
        "widget-card--disabled": disabled,
      })}
      data-accent={accent}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
    >
      <header className="widget-card__header">
        <div className="widget-card__title">
          {icone && <span className="widget-card__icon">{icone}</span>}
          <div>
            <h2>{titre}</h2>
            {description && <p>{description}</p>}
          </div>
        </div>
        {actions && <div className="widget-card__actions">{actions}</div>}
      </header>
      <div className="widget-card__content">{children}</div>
    </section>
  );
};
