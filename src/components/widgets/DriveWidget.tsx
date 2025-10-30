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
  onItemNavigate?: (item: DriveNode) => void;
}

const MAX_WIDGET_ITEMS = 2;

export const DriveWidget = ({ items, loading, onOpen, disabled = false, onItemNavigate }: DriveWidgetProps) => {
  const latest = useMemo(
    () => items.slice(0, MAX_WIDGET_ITEMS),
    [items]
  ); // Ajustement : conserve deux éléments récents tout en gardant le widget lisible.

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
        <ul className="widget-list">
          {latest.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="widget-list__link"
                onClick={(event) => {
                  event.stopPropagation();
                  onItemNavigate?.(item);
                }}
              >
                <div className="widget-list__main">
                  <p className="widget-list__title">{item.nom}</p>
                  <span className="widget-list__meta">
                    {formatRelativeDate(item.misAJourLe)} · {item.type === "dossier" ? "Dossier" : item.extension.toUpperCase()}
                  </span>
                </div>
                <span className="widget-list__aside">
                  {item.type === "fichier" ? formatWeight(item.poidsMo) : item.partage ? "Partagé" : "Privé"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};
