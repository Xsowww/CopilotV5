import { useMemo } from "react";
import { PiFoldersFill } from "react-icons/pi";
import { WidgetCard } from "../common/WidgetCard";
import { formatRelativeDate, formatWeight } from "../../utils/formatters";
import type { DriveNode } from "../../types";

interface DriveWidgetProps {
  items: DriveNode[];
  loading?: boolean;
  onOpen?: () => void;
  disabled?: boolean;
}

export const DriveWidget = ({ items, loading, onOpen, disabled = false }: DriveWidgetProps) => {
  const latest = useMemo(() => items.slice(0, 4), [items]);

  return (
    <WidgetCard
      titre="Drive"
      description="Dernières activités"
      icone={<PiFoldersFill size={24} />}
      accent="bleu"
      onClick={onOpen}
      disabled={disabled}
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
                  {formatRelativeDate(item.misAJourLe)} · {item.type === "dossier" ? "Dossier" : item.extension.toUpperCase()}
                </span>
              </div>
              <span className="drive-widget__size">
                {item.type === "fichier" ? formatWeight(item.poidsMo) : item.partage ? "Partagé" : "Privé"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};
