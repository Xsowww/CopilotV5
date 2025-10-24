import { PiSparkleFill } from "react-icons/pi";
import { WidgetCard } from "../common/WidgetCard";
import { formatRelativeDate } from "../../utils/formatters";
import type { WidgetActivity } from "../../types";

interface ActivityWidgetProps {
  activities: WidgetActivity[];
  loading?: boolean;
  onOpen?: () => void;
  disabled?: boolean;
}

export const ActivityWidget = ({ activities, loading, onOpen, disabled = false }: ActivityWidgetProps) => {
  const highlights = activities.slice(0, 5);

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
        <ul className="activity-widget">
          {highlights.map((activity) => (
            <li key={activity.id}>
              <div>
                <p className="activity-widget__title">{activity.titre}</p>
                <span className="activity-widget__meta">
                  {activity.type === "drive"
                    ? "Drive"
                    : activity.type === "organisation"
                      ? "Organisation"
                      : "Notes"}
                  {" · "}
                  {activity.utilisateur}
                </span>
              </div>
              <span className="activity-widget__time">
                {formatRelativeDate(activity.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};
