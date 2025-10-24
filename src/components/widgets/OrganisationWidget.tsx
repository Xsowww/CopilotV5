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
  const prochainsEvenements = evenements.slice(0, 2);
  const prochainesTaches = taches.slice(0, 2);
  const prochainsRappels = rappels.slice(0, 2);

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
          <section>
            <h3>Événements</h3>
            {prochainsEvenements.length === 0 ? (
              <p className="widget-card__empty">Aucun événement programmé.</p>
            ) : (
              <ul>
                {prochainsEvenements.map((event) => {
                  const date = formatCalendarDate(event.date);
                  return (
                    <li key={event.id}>
                      <div className="organisation-widget__date">
                        <span>{date.jour}</span>
                        <span>{date.mois}</span>
                      </div>
                      <div>
                        <p className="organisation-widget__title">{event.titre}</p>
                        <span className="organisation-widget__meta">
                          {date.heure} · {event.localisation ?? "Lieu à confirmer"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3>Tâches</h3>
            {prochainesTaches.length === 0 ? (
              <p className="widget-card__empty">Aucune tâche en attente.</p>
            ) : (
              <ul>
                {prochainesTaches.map((task) => {
                  const echeance = formatCalendarDate(task.echeance);
                  return (
                    <li key={task.id}>
                      <div className={`organisation-widget__pill organisation-widget__pill--${task.priorite}`}>
                        {task.priorite}
                      </div>
                      <div>
                        <p className="organisation-widget__title">{task.titre}</p>
                        <span className="organisation-widget__meta">
                          Statut : {task.statut.replace("_", " ")} · Échéance {echeance.jour} {echeance.mois}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3>Rappels</h3>
            {prochainsRappels.length === 0 ? (
              <p className="widget-card__empty">Aucun rappel planifié.</p>
            ) : (
              <ul>
                {prochainsRappels.map((reminder) => {
                  const date = formatCalendarDate(reminder.date);
                  return (
                    <li key={reminder.id}>
                      <div className="organisation-widget__date">
                        <span>{date.jour}</span>
                        <span>{date.mois}</span>
                      </div>
                      <div>
                        <p className="organisation-widget__title">{reminder.titre}</p>
                        <span className="organisation-widget__meta">
                          {reminder.description ?? "Pas de description"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </WidgetCard>
  );
};
