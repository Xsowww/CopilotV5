import { NavLink } from "react-router-dom";
import { PiHouseFill, PiFoldersFill, PiNotebookFill } from "react-icons/pi";
import { MdOutlineCalendarMonth } from "react-icons/md";

const navigation = [
  { chemin: "/", label: "Tableau de bord", icone: <PiHouseFill /> },
  { chemin: "/drive", label: "Drive", icone: <PiFoldersFill /> },
  { chemin: "/organisation", label: "Organisation", icone: <MdOutlineCalendarMonth /> },
  { chemin: "/notes", label: "Notes", icone: <PiNotebookFill /> },
];

export const AppSidebar = () => {
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
    </aside>
  );
};
