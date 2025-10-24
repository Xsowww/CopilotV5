import { useMemo } from "react";
import { PiFoldersFill } from "react-icons/pi";
import { WidgetCard } from "../common/WidgetCard";
import { formatRelativeDate, formatWeight } from "../../utils/formatters";
import type { DriveItem } from "../../types";

interface DriveWidgetProps {
  items: DriveItem[];
  loading?: boolean;
}

export const DriveWidget = ({ items, loading }: DriveWidgetProps) => {
  const latest = useMemo(() => items.slice(0, 4), [items]);

  return (
    <WidgetCard
      titre="Drive"
      description="Dernières activités"
      icone={<PiFoldersFill size={24} />}
      accent="bleu"
    >
      {loading ? (
        <p className="widget-card__empty">Chargement…</p>
      ) : latest.length === 0 ? (
        <p className="widget-card__empty">Aucune activité récente.</p>
      ) : (
        <ul className="drive-widget">
          {latest.map((item) => (
            <li key={item.id}>
              <div>
                <p className="drive-widget__name">{item.nom}</p>
                <span className="drive-widget__meta">
                  {formatRelativeDate(item.derniereModification)} · {item.proprietaire}
                </span>
              </div>
              <span className="drive-widget__size">{formatWeight(item.poidsMo)}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};
