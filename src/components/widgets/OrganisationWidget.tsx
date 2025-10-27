import { useMemo } from "react";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { WidgetCard } from "../common/WidgetCard";
import { formatCalendarDate, truncateText } from "../../utils/formatters";
import type { Evenement, Rappel, Tache } from "../../types";

interface OrganisationWidgetProps {
  evenements: Evenement[];
  taches: Tache[];
  rappels: Rappel[];
  loading?: boolean;
  onOpen?: () => void;
  disabled?: boolean;
  onEvenementNavigate?: (evenement: Evenement) => void;
  onTacheNavigate?: (tache: Tache) => void;
  onRappelNavigate?: (rappel: Rappel) => void;
}

export const OrganisationWidget = ({
  evenements,
  taches,
  rappels,
  loading,
  onOpen,
  disabled = false,
  onEvenementNavigate,
  onTacheNavigate,
  onRappelNavigate,
}: OrganisationWidgetProps) => {
  // Modification : tri par date pour sélectionner les éléments réellement les plus récents.
  const [prochainEvenement, prochaineTache, prochainRappel] = useMemo(() => {
    const sortByDate = <T extends { date: string }>(items: T[]) =>
      [...items].sort((a, b) => a.date.localeCompare(b.date));
    const sortedEvents = sortByDate(evenements);
    const sortedTasks = sortByDate(taches);
    const sortedReminders = sortByDate(rappels);
    return [sortedEvents[0], sortedTasks[0], sortedReminders[0]];
  }, [evenements, taches, rappels]);

  const renderEvenement = () => {
    if (!prochainEvenement) {
      return <p className="widget-card__empty">Aucun événement programmé.</p>;
    }
    const date = formatCalendarDate(prochainEvenement.date);
    return (
      <button
        type="button"
        className="organisation-widget__button"
        onClick={(event) => {
          event.stopPropagation();
          onEvenementNavigate?.(prochainEvenement);
        }}
      >
        <div className="organisation-widget__badge">
          <span>{date.jour}</span>
          <span>{date.mois}</span>
        </div>
        <div className="organisation-widget__details">
          <p className="organisation-widget__title">{truncateText(prochainEvenement.titre, 18)}</p>
          <span className="organisation-widget__meta">
            {(date.heure ?? "Toute la journée")} · Priorité {prochainEvenement.priorite ?? "normale"}
          </span>
        </div>
        {prochainEvenement.urgent && <span className="organisation-widget__flag">Urgent</span>}
      </button>
    );
  };

  const renderTache = () => {
    if (!prochaineTache) {
      return <p className="widget-card__empty">Aucune tâche en attente.</p>;
    }
    const echeance = formatCalendarDate(prochaineTache.echeance);
    return (
      <button
        type="button"
        className="organisation-widget__button"
        onClick={(event) => {
          event.stopPropagation();
          onTacheNavigate?.(prochaineTache);
        }}
      >
        <div className={`organisation-widget__pill organisation-widget__pill--${prochaineTache.priorite}`}>
          {prochaineTache.priorite}
        </div>
        <div className="organisation-widget__details">
          <p className="organisation-widget__title">{truncateText(prochaineTache.titre, 18)}</p>
          <span className="organisation-widget__meta">
            Statut : {prochaineTache.statut.replace(/_/g, " ")} · Échéance {echeance.jour} {echeance.mois}
          </span>
        </div>
      </button>
    );
  };

  const renderRappel = () => {
    if (!prochainRappel) {
      return <p className="widget-card__empty">Aucun rappel planifié.</p>;
    }
    const date = formatCalendarDate(prochainRappel.date);
    const titre = truncateText(prochainRappel.titre, 7);
    return (
      <button
        type="button"
        className="organisation-widget__button"
        onClick={(event) => {
          event.stopPropagation();
          onRappelNavigate?.(prochainRappel);
        }}
      >
        <div className="organisation-widget__badge">
          <span>{date.jour}</span>
          <span>{date.mois}</span>
        </div>
        <div className="organisation-widget__details">
          {/* Mise à jour : rappel tronqué pour rester lisible dans le widget compact. */}
          <p className="organisation-widget__title">{titre}</p>
          <span className="organisation-widget__meta">{prochainRappel.description ?? "Pas de description"}</span>
        </div>
      </button>
    );
  };

  return (
    <WidgetCard
      titre="Organisation"
      description="Événements et rappels à venir"
      icone={<MdOutlineCalendarMonth size={24} />}
      accent="jaune"
      onClick={onOpen}
      disabled={disabled}
    >
      {loading ? (
        <p className="widget-card__empty">Chargement…</p>
      ) : (
        <div className="organisation-widget">
          <section className="organisation-widget__section">
            <h3>Événement à venir</h3>
            {renderEvenement()}
          </section>

          <section className="organisation-widget__section">
            <h3>Tâche prioritaire</h3>
            {renderTache()}
          </section>

          <section className="organisation-widget__section">
            <h3>Rappel</h3>
            {renderRappel()}
          </section>
        </div>
      )}
    </WidgetCard>
  );
};
