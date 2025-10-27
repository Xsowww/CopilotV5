import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  formatISO,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { PiCalendarBlankFill, PiCalendarCheckFill, PiCalendarFill, PiPlusBold } from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../../context/AppDataContext";
import { ActionDialog } from "../../components/common/ActionDialog";
import type { Evenement, Rappel, Tache } from "../../types";
import { truncateText } from "../../utils/formatters";

const VIEWS = [
  { id: "jour" as const, label: "Jour", icon: <PiCalendarFill size={16} /> },
  { id: "semaine" as const, label: "Semaine", icon: <PiCalendarCheckFill size={16} /> },
  { id: "mois" as const, label: "Mois", icon: <PiCalendarBlankFill size={16} /> },
];

type ViewId = (typeof VIEWS)[number]["id"];

type EditorType = "evenement" | "tache" | "rappel";

interface EditorState {
  type: EditorType;
  data: Partial<Evenement & Tache & Rappel> & { id?: string; date: string };
}

type DeletionState = { open: false } | { open: true; type: EditorType; id: string; titre: string };

const toDate = (iso: string) => parseISO(iso);

const formatHour = (value: string | undefined) => (value ? value : "");

export const OrganisationPage = () => {
  const {
    organisation,
    saveEvenement,
    deleteEvenement,
    saveTache,
    deleteTache,
    saveRappel,
    deleteRappel,
  } = useAppData();
  const [view, setView] = useState<ViewId>("semaine");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deletion, setDeletion] = useState<DeletionState>({ open: false });
  const location = useLocation();
  const navigate = useNavigate();

  const events = useMemo(() => organisation.evenements.map((event) => ({ ...event, dateObj: toDate(event.date) })), [
    organisation.evenements,
  ]);
  const tasks = useMemo(
    () => organisation.taches.map((task) => ({ ...task, dateObj: toDate(task.date) })),
    [organisation.taches]
  );
  const reminders = useMemo(
    () => organisation.rappels.map((reminder) => ({ ...reminder, dateObj: toDate(reminder.date) })),
    [organisation.rappels]
  );

  const startOfCurrentWeek = startOfWeek(selectedDate, { locale: fr, weekStartsOn: 1 });

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(selectedDate), { locale: fr, weekStartsOn: 1 });
    return Array.from({ length: 42 }).map((_, index) => addDays(start, index));
  }, [selectedDate]);

  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, index) => addDays(startOfCurrentWeek, index)), [
    startOfCurrentWeek,
  ]);

  const eventsForDay = (date: Date) => events.filter((event) => isSameDay(event.dateObj, date));
  const tasksForDay = (date: Date) => tasks.filter((task) => isSameDay(task.dateObj, date));
  const remindersForDay = (date: Date) => reminders.filter((reminder) => isSameDay(reminder.dateObj, date));

  const openEditor = (type: EditorType, id?: string) => {
    if (type === "evenement" && id) {
      const existing = organisation.evenements.find((event) => event.id === id);
      if (existing) {
        // Modification : on applique des valeurs par défaut pour les nouveaux champs d'événement.
        setEditor({
          type,
          data: {
            ...existing,
            priorite: existing.priorite ?? "normale",
            urgent: existing.urgent ?? false,
          },
        });
        return;
      }
    }
    if (type === "tache" && id) {
      const existing = organisation.taches.find((task) => task.id === id);
      if (existing) {
        setEditor({ type, data: { ...existing } });
        return;
      }
    }
    if (type === "rappel" && id) {
      const existing = organisation.rappels.find((reminder) => reminder.id === id);
      if (existing) {
        setEditor({ type, data: { ...existing } });
        return;
      }
    }

    setEditor({
      type,
      data: {
        date: formatISO(selectedDate),
        heure: "09:00",
        titre: "",
        priorite: "normale",
        urgent: false,
      },
    });
  };

  const handleDelete = (type: EditorType, id: string) => {
    let titre = "";
    if (type === "evenement") {
      titre = organisation.evenements.find((item) => item.id === id)?.titre ?? "Événement";
    }
    if (type === "tache") {
      titre = organisation.taches.find((item) => item.id === id)?.titre ?? "Tâche";
    }
    if (type === "rappel") {
      titre = organisation.rappels.find((item) => item.id === id)?.titre ?? "Rappel";
    }
    setDeletion({ open: true, type, id, titre });
  };

  const confirmDeletion = () => {
    if (!deletion.open) return;
    switch (deletion.type) {
      case "evenement":
        deleteEvenement(deletion.id);
        break;
      case "tache":
        deleteTache(deletion.id);
        break;
      case "rappel":
        deleteRappel(deletion.id);
        break;
      default:
        break;
    }
    if (editor?.data.id === deletion.id) {
      setEditor(null);
    }
    setDeletion({ open: false });
  };

  const closeDeletion = () => setDeletion({ open: false });
  const deletionLabel = deletion.open ? deletion.titre : "cet élément";

  const saveEditor = (state: EditorState) => {
    const baseId = state.data.id ?? crypto.randomUUID();
    const payload = {
      ...state.data,
      id: baseId,
      date: state.data.date ?? formatISO(selectedDate),
    } as Evenement & Tache & Rappel;

    switch (state.type) {
      case "evenement":
        saveEvenement({
          id: payload.id,
          titre: payload.titre ?? "Nouvel événement",
          description: payload.description,
          date: payload.date,
          heure: payload.heure,
          priorite: (payload.priorite ?? "normale") as Evenement["priorite"],
          urgent: Boolean(payload.urgent),
          categorie: payload.categorie,
        });
        break;
      case "tache":
        saveTache({
          id: payload.id,
          titre: payload.titre ?? "Nouvelle tâche",
          description: payload.description,
          date: payload.date,
          heure: payload.heure,
          priorite: (payload.priorite ?? "normale") as Tache["priorite"],
          statut: (payload.statut ?? "pas_commence") as Tache["statut"],
          echeance: payload.echeance ?? payload.date,
        });
        break;
      case "rappel":
        saveRappel({
          id: payload.id,
          titre: payload.titre ?? "Nouveau rappel",
          description: payload.description,
          date: payload.date,
          recurrent: payload.recurrent ?? false,
        });
        break;
      default:
        break;
    }
    setEditor(null);
  };

  const navigateWeek = (direction: "next" | "prev") => {
    setSelectedDate((prev) => (direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)));
  };

  useEffect(() => {
    const state = location.state as { focusOrganisation?: { type: EditorType; id: string } } | null;
    if (!state?.focusOrganisation) {
      return;
    }

    const { type, id } = state.focusOrganisation;
    let targetDate: Date | null = null;

    if (type === "evenement") {
      const existing = organisation.evenements.find((event) => event.id === id);
      if (existing) {
        targetDate = parseISO(existing.date);
        setEditor({ type, data: { ...existing } });
      }
    }

    if (type === "tache") {
      const existing = organisation.taches.find((task) => task.id === id);
      if (existing) {
        targetDate = parseISO(existing.date);
        setEditor({ type, data: { ...existing } });
      }
    }

    if (type === "rappel") {
      const existing = organisation.rappels.find((reminder) => reminder.id === id);
      if (existing) {
        targetDate = parseISO(existing.date);
        setEditor({ type, data: { ...existing } });
      }
    }

    if (targetDate) {
      // Modification : focus automatique sur la date associée à l'élément ouvert depuis le widget.
      setSelectedDate(targetDate);
      setView("semaine");
    }

    navigate(".", { replace: true, state: null });
  }, [location.state, organisation.evenements, organisation.taches, organisation.rappels, navigate]);

  return (
    <div className="organisation-page">
      <header className="organisation-page__header">
        <div>
          <h2>Organisation</h2>
          <p>Visualise et planifie ton calendrier, tes tâches et tes rappels.</p>
        </div>
        <div className="organisation-page__toolbar">
          <div className="organisation-page__view-switcher">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={view === item.id ? "btn-primary" : "btn-secondary"}
                onClick={() => setView(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
          <div className="organisation-page__date-actions">
            <button type="button" className="btn-secondary" onClick={() => setSelectedDate(new Date())}>
              Aujourd'hui
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigateWeek("prev")}>
              &lt;
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigateWeek("next")}>
              &gt;
            </button>
            <button type="button" className="btn-primary" onClick={() => openEditor("evenement")}>
              <PiPlusBold size={14} /> Ajouter
            </button>
          </div>
        </div>
      </header>

      <div className="organisation-page__layout">
        <section className="organisation-calendar">
          {view === "mois" && (
            <div className="calendar-month">
              {monthDays.map((day) => {
                const dayEvents = eventsForDay(day);
                const isCurrent = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={`calendar-month__cell ${isCurrent ? "calendar-month__cell--active" : ""} ${
                      isSameMonth(day, selectedDate) ? "" : "calendar-month__cell--muted"
                    }`.trim()}
                    onClick={() => setSelectedDate(day)}
                  >
                    <span className="calendar-month__weekday">{format(day, "EEEE", { locale: fr })}</span>
                    <span className="calendar-month__date">{format(day, "d", { locale: fr })}</span>
                    {dayEvents.slice(0, 3).map((event) => (
                      <span key={event.id} className="calendar-month__event">
                        {truncateText(event.titre, 8)}
                      </span>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="calendar-month__more">+{dayEvents.length - 3}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {view === "semaine" && (
            <div className="calendar-week">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="calendar-week__column">
                  <header>
                    <span>{format(day, "EEE d", { locale: fr })}</span>
                  </header>
                  <div className="calendar-week__events">
                    {eventsForDay(day).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className="calendar-week__event"
                        onClick={() => openEditor("evenement", event.id)}
                      >
                        <strong>{truncateText(event.titre, 8)}</strong>
                        <span>{event.heure ?? "Toute la journée"}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="calendar-week__add"
                      onClick={() => {
                        setSelectedDate(day);
                        openEditor("evenement");
                      }}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "jour" && (
            <div className="calendar-day">
              <header>
                <h3>{format(selectedDate, "EEEE d MMMM", { locale: fr })}</h3>
              </header>
              <div className="calendar-day__events">
                {eventsForDay(selectedDate).length === 0 ? (
                  <p className="widget-card__empty">Aucun événement aujourd'hui.</p>
                ) : (
                  eventsForDay(selectedDate).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className="calendar-day__event"
                      onClick={() => openEditor("evenement", event.id)}
                    >
                      <span>{event.heure ?? "Toute la journée"}</span>
                      <strong>{truncateText(event.titre, 8)}</strong>
                      {event.description && <small>{event.description}</small>}
                    </button>
                  ))
                )}
                <button type="button" className="calendar-day__add" onClick={() => openEditor("evenement")}>Ajouter un événement</button>
              </div>
            </div>
          )}
        </section>

        <aside className="organisation-sidebar">
          <section>
            <header>
              <h3>Tâches du {format(selectedDate, "d MMMM", { locale: fr })}</h3>
              <button type="button" className="btn-tertiary" onClick={() => openEditor("tache")}>
                <PiPlusBold size={14} />
              </button>
            </header>
            {tasksForDay(selectedDate).length === 0 ? (
              <p className="widget-card__empty">Aucune tâche prévue.</p>
            ) : (
              <ul className="organisation-sidebar__list">
                {tasksForDay(selectedDate).map((task) => (
                  <li key={task.id}>
                    <button type="button" onClick={() => openEditor("tache", task.id)}>
                      <div>
                        <strong>{task.titre}</strong>
                        <span>
                          {task.priorite} · {task.statut.replace("_", " ")}
                        </span>
                      </div>
                      <span>{formatHour(task.heure)}</span>
                    </button>
                    <button
                      type="button"
                      className="organisation-sidebar__delete"
                      onClick={() => handleDelete("tache", task.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <header>
              <h3>Rappels</h3>
              <button type="button" className="btn-tertiary" onClick={() => openEditor("rappel")}>
                <PiPlusBold size={14} />
              </button>
            </header>
            {remindersForDay(selectedDate).length === 0 ? (
              <p className="widget-card__empty">Aucun rappel pour cette date.</p>
            ) : (
              <ul className="organisation-sidebar__list organisation-sidebar__list--simple">
                {remindersForDay(selectedDate).map((reminder) => (
                  <li key={reminder.id}>
                    <button type="button" onClick={() => openEditor("rappel", reminder.id)}>
                      {/* Nouveau : limitation à 7 caractères pour garder une liste parfaitement lisible. */}
                      <strong>{truncateText(reminder.titre, 7)}</strong>
                      <span>{reminder.description ?? ""}</span>
                    </button>
                    <button
                      type="button"
                      className="organisation-sidebar__delete"
                      onClick={() => handleDelete("rappel", reminder.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {editor && (
        <div className="organisation-editor" role="dialog" aria-modal="true">
          <div className="organisation-editor__content">
            <header>
              <h3>
                {editor.type === "evenement" && "Événement"}
                {editor.type === "tache" && "Tâche"}
                {editor.type === "rappel" && "Rappel"}
              </h3>
              <button type="button" onClick={() => setEditor(null)}>
                ×
              </button>
            </header>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveEditor(editor);
              }}
            >
              <label>
                Titre
                <input
                  type="text"
                  value={editor.data.titre ?? ""}
                  onChange={(event) => setEditor({
                    type: editor.type,
                    data: { ...editor.data, titre: event.target.value },
                  })}
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={format(parseISO(editor.data.date ?? formatISO(selectedDate)), "yyyy-MM-dd")}
                  onChange={(event) =>
                    setEditor({
                      type: editor.type,
                      data: { ...editor.data, date: formatISO(new Date(event.target.value)) },
                    })
                  }
                  required
                />
              </label>
              {editor.type !== "rappel" && (
                <label>
                  Heure
                  <input
                    type="time"
                    value={editor.data.heure ?? ""}
                    onChange={(event) =>
                      setEditor({
                        type: editor.type,
                        data: { ...editor.data, heure: event.target.value },
                      })
                    }
                  />
                </label>
              )}
              <label>
                Description
                <textarea
                  value={editor.data.description ?? ""}
                  onChange={(event) =>
                    setEditor({
                      type: editor.type,
                      data: { ...editor.data, description: event.target.value },
                    })
                  }
                  rows={3}
                />
              </label>
              {editor.type === "evenement" && (
                <div className="organisation-editor__grid">
                  <label>
                    Priorité
                    <select
                      value={(editor.data.priorite as Evenement["priorite"]) ?? "normale"}
                      onChange={(event) =>
                        setEditor({
                          type: editor.type,
                          data: { ...editor.data, priorite: event.target.value as Evenement["priorite"] },
                        })
                      }
                    >
                      <option value="faible">Faible</option>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                    </select>
                  </label>
                  <label className="organisation-editor__checkbox organisation-editor__checkbox--inline">
                    <input
                      type="checkbox"
                      checked={Boolean(editor.data.urgent)}
                      onChange={(event) =>
                        setEditor({
                          type: editor.type,
                          data: { ...editor.data, urgent: event.target.checked },
                        })
                      }
                    />
                    Événement urgent
                  </label>
                </div>
              )}
              {editor.type === "tache" && (
                <div className="organisation-editor__grid">
                  <label>
                    Priorité
                    <select
                      value={editor.data.priorite ?? "normale"}
                      onChange={(event) =>
                        setEditor({
                          type: editor.type,
                          data: { ...editor.data, priorite: event.target.value as Tache["priorite"] },
                        })
                      }
                    >
                      <option value="faible">Faible</option>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                    </select>
                  </label>
                  <label>
                    Statut
                    <select
                      value={editor.data.statut ?? "pas_commence"}
                      onChange={(event) =>
                        setEditor({
                          type: editor.type,
                          data: { ...editor.data, statut: event.target.value as Tache["statut"] },
                        })
                      }
                    >
                      <option value="pas_commence">Pas commencé</option>
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminé</option>
                    </select>
                  </label>
                  <label>
                    Échéance
                    <input
                      type="date"
                      value={format(parseISO(editor.data.echeance ?? editor.data.date ?? formatISO(selectedDate)), "yyyy-MM-dd")}
                      onChange={(event) =>
                        setEditor({
                          type: editor.type,
                          data: { ...editor.data, echeance: formatISO(new Date(event.target.value)) },
                        })
                      }
                    />
                  </label>
                </div>
              )}
              {editor.type === "rappel" && (
                <label className="organisation-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(editor.data.recurrent)}
                    onChange={(event) =>
                      setEditor({
                        type: editor.type,
                        data: { ...editor.data, recurrent: event.target.checked },
                      })
                    }
                  />
                  Répéter
                </label>
              )}
              <footer>
                {editor.data.id && (
                  <button
                    type="button"
                    className="btn-tertiary"
                    onClick={() => handleDelete(editor.type, editor.data.id!)}
                  >
                    Supprimer
                  </button>
                )}
                <div>
                  <button type="button" className="btn-secondary" onClick={() => setEditor(null)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Enregistrer
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Mise à jour : confirmation harmonisée des suppressions */}
      <ActionDialog
        open={deletion.open}
        title="Confirmer la suppression"
        description={`"${deletionLabel}" sera retiré de ton organisation.`}
        confirmLabel="Supprimer"
        onClose={closeDeletion}
        onConfirm={confirmDeletion}
      />
    </div>
  );
};
