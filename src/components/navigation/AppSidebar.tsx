import { NavLink } from "react-router-dom";
import { PiHouseFill, PiFoldersFill, PiNotebookFill } from "react-icons/pi";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { useMemo } from "react";
import { useAppData } from "../../context/AppDataContext";

const navigation = [
  { chemin: "/", label: "Tableau de bord", icone: <PiHouseFill /> },
  { chemin: "/drive", label: "Drive", icone: <PiFoldersFill /> },
  { chemin: "/organisation", label: "Organisation", icone: <MdOutlineCalendarMonth /> },
  { chemin: "/notes", label: "Notes", icone: <PiNotebookFill /> },
];

export const AppSidebar = () => {
  const { organisation } = useAppData();
  const { total, restantes, progression } = useMemo(() => {
    const totalTaches = organisation.taches.length;
    const restantesTaches = organisation.taches.filter((tache) => tache.statut !== "termine").length;
    const progressionPourcentage =
      totalTaches === 0
        ? 0
        : Math.min(100, Math.max(0, Math.round(((totalTaches - restantesTaches) / totalTaches) * 100)));
    return { total: totalTaches, restantes: restantesTaches, progression: progressionPourcentage };
  }, [organisation.taches]);

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__brand">Copilot</span>
        <span className="sidebar__tag">beta</span>
      </div>
      <nav>
        <ul>
          {navigation.map((item) => (
            <li key={item.chemin}>
              <NavLink
                to={item.chemin}
                end={item.chemin === "/"}
                className={({ isActive }) =>
                  isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
                }
              >
                <span className="sidebar__icon">{item.icone}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {/* Mise à jour : résumé des tâches avec progression pour rappel permanent. */}
      <div className="sidebar__summary">
        <div className="sidebar__summary-header">
          <span>Tâches à réaliser</span>
          <strong>{restantes}</strong>
        </div>
        <div className="sidebar__summary-progress" aria-label="Progression des tâches">
          <div className="sidebar__summary-bar">
            <span style={{ width: `${progression}%` }} />
          </div>
          <p>
            {total === 0
              ? "Aucune tâche enregistrée"
              : `${progression}% terminées (${total - restantes}/${total})`}
          </p>
        </div>
      </div>
    </aside>
  );
};
