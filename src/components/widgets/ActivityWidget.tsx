import { useMemo } from "react";
import { PiSparkleFill } from "react-icons/pi";
import { WidgetCard } from "../common/WidgetCard";
import { formatRelativeDate } from "../../utils/formatters";
import type { WidgetActivity } from "../../types";

interface ActivityWidgetProps {
  activities: WidgetActivity[];
  loading?: boolean;
  onOpen?: () => void;
  disabled?: boolean;
  onActivityNavigate?: (activity: WidgetActivity) => void;
}

const MAX_WIDGET_ITEMS = 1;

export const ActivityWidget = ({
  activities,
  loading,
  onOpen,
  disabled = false,
  onActivityNavigate,
}: ActivityWidgetProps) => {
  const highlights = useMemo(
    () => activities.slice(0, MAX_WIDGET_ITEMS),
    [activities]
  ); // Limite l'aperçu au dernier événement pour conserver un widget léger et lisible.

  return (
    <WidgetCard
      titre="Synthèse"
      description="Tout ce qu'il ne faut pas manquer"
      icone={<PiSparkleFill size={24} />}
      accent="vert"
      onClick={onOpen}
      disabled={disabled}
    >
      {loading ? (
        <p className="widget-card__empty">Chargement…</p>
      ) : highlights.length === 0 ? (
        <p className="widget-card__empty">Aucune activité récente.</p>
      ) : (
        <ul className="widget-list">
          {highlights.map((activity) => (
            <li key={activity.id}>
              <button
                type="button"
                className="widget-list__link"
                onClick={(event) => {
                  event.stopPropagation();
                  onActivityNavigate?.(activity);
                }}
              >
                <div className="widget-list__main">
                  <p className="widget-list__title">{activity.titre}</p>
                  <span className="widget-list__meta">
                    {activity.type === "drive"
                      ? "Drive"
                      : activity.type === "organisation"
                        ? "Organisation"
                        : "Notes"}
                    {" · "}
                    {activity.utilisateur}
                  </span>
                </div>
                <span className="widget-list__aside">{formatRelativeDate(activity.date)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};
