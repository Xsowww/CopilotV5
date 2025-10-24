import { MdOutlineCalendarMonth } from "react-icons/md";
import { WidgetCard } from "../common/WidgetCard";
import { formatCalendarDate } from "../../utils/formatters";
import type { Evenement, Rappel, Tache } from "../../types";

interface OrganisationWidgetProps {
  evenements: Evenement[];
  taches: Tache[];
  rappels: Rappel[];
  loading?: boolean;
  onOpen?: () => void;
  disabled?: boolean;
}

export const OrganisationWidget = ({
  evenements,
  taches,
  rappels,
  loading,
  onOpen,
  disabled = false,
}: OrganisationWidgetProps) => {
  // Modification : ne conserver que la première entrée de chaque catégorie pour proposer un résumé synthétique.
  const prochainEvenement = evenements[0];
  const prochaineTache = taches[0];
  const prochainRappel = rappels[0];

  const renderEvenement = () => {
    if (!prochainEvenement) {
      return <p className="widget-card__empty">Aucun événement programmé.</p>;
    }
    const date = formatCalendarDate(prochainEvenement.date);
    return (
      <div className="organisation-widget__highlight">
        <div className="organisation-widget__badge">
          <span>{date.jour}</span>
          <span>{date.mois}</span>
        </div>
        <div className="organisation-widget__details">
          <p className="organisation-widget__title">{prochainEvenement.titre}</p>
          <span className="organisation-widget__meta">
            {(date.heure ?? "Toute la journée")} · {prochainEvenement.localisation ?? "Lieu à confirmer"}
          </span>
        </div>
      </div>
    );
  };

  const renderTache = () => {
    if (!prochaineTache) {
      return <p className="widget-card__empty">Aucune tâche en attente.</p>;
    }
    const echeance = formatCalendarDate(prochaineTache.echeance);
    return (
      <div className="organisation-widget__highlight">
        <div className={`organisation-widget__pill organisation-widget__pill--${prochaineTache.priorite}`}>
          {prochaineTache.priorite}
        </div>
        <div className="organisation-widget__details">
          <p className="organisation-widget__title">{prochaineTache.titre}</p>
          <span className="organisation-widget__meta">
            Statut : {prochaineTache.statut.replace(/_/g, " ")} · Échéance {echeance.jour} {echeance.mois}
          </span>
        </div>
      </div>
    );
  };

  const renderRappel = () => {
    if (!prochainRappel) {
      return <p className="widget-card__empty">Aucun rappel planifié.</p>;
    }
    const date = formatCalendarDate(prochainRappel.date);
    return (
      <div className="organisation-widget__highlight">
        <div className="organisation-widget__badge">
          <span>{date.jour}</span>
          <span>{date.mois}</span>
        </div>
        <div className="organisation-widget__details">
          <p className="organisation-widget__title">{prochainRappel.titre}</p>
          <span className="organisation-widget__meta">{prochainRappel.description ?? "Pas de description"}</span>
        </div>
      </div>
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
