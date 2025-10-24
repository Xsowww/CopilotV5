import { useEffect, useState } from "react";
import type { Evenement, Rappel, Tache } from "../../types";
import { mockApi } from "../../services/mockApi";
import { formatCalendarDate, formatRelativeDate } from "../../utils/formatters";

interface OrganisationState {
  evenements: Evenement[];
  taches: Tache[];
  rappels: Rappel[];
}

export const OrganisationPage = () => {
  const [data, setData] = useState<OrganisationState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.fetchOrganisation().then((organisation) => {
      setData(organisation);
      setLoading(false);
    });
  }, []);

  return (
    <div className="organisation-page">
      <header className="organisation-page__header">
        <h2>Organisation</h2>
        <p>Gère ton calendrier, tes tâches et tes rappels en un clin d'œil.</p>
      </header>

      {loading || !data ? (
        <p className="widget-card__empty">Chargement…</p>
      ) : (
        <div className="organisation-page__grid">
          <section className="organisation-panel">
            <h3>Calendrier</h3>
            <ul>
              {data.evenements.map((evenement) => {
                const date = formatCalendarDate(evenement.date);
                return (
                  <li key={evenement.id}>
                    <div className="organisation-panel__date">
                      <span>{date.jour}</span>
                      <span>{date.mois}</span>
                    </div>
                    <div>
                      <p className="organisation-panel__title">{evenement.titre}</p>
                      <span className="organisation-panel__meta">
                        {evenement.heure ?? "Horaire à définir"} · {evenement.localisation ?? "Lieu à confirmer"}
                      </span>
                      {evenement.description && <p>{evenement.description}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="organisation-panel">
            <h3>Tâches</h3>
            <ul>
              {data.taches.map((tache) => (
                <li key={tache.id}>
                  <div className={`organisation-widget__pill organisation-widget__pill--${tache.priorite}`}>
                    {tache.priorite}
                  </div>
                  <div>
                    <p className="organisation-panel__title">{tache.titre}</p>
                    <span className="organisation-panel__meta">
                      Statut : {tache.statut.replace("_", " ")} · Échéance {formatRelativeDate(tache.echeance)}
                    </span>
                    {tache.description && <p>{tache.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="organisation-panel">
            <h3>Rappels</h3>
            <ul>
              {data.rappels.map((rappel) => (
                <li key={rappel.id}>
                  <div className="organisation-panel__date">
                    <span>{formatCalendarDate(rappel.date).jour}</span>
                    <span>{formatCalendarDate(rappel.date).mois}</span>
                  </div>
                  <div>
                    <p className="organisation-panel__title">{rappel.titre}</p>
                    <span className="organisation-panel__meta">
                      {rappel.description ?? "Pas de détails"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
