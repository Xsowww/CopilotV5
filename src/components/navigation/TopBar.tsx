import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PiBellSimpleFill, PiCloudFill } from "react-icons/pi";

export const TopBar = () => {
  const date = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <header className="topbar">
      <div className="topbar__left">
        <PiCloudFill size={26} />
        <div>
          <p className="topbar__subtitle">Bienvenue, Léo</p>
          <h1 className="topbar__title">Tableau de bord étudiant</h1>
        </div>
      </div>
      <div className="topbar__right">
        <span className="topbar__date">{date}</span>
        <button type="button" className="topbar__action" aria-label="Notifications">
          <PiBellSimpleFill size={18} />
        </button>
        <div className="topbar__avatar">
          <img src="https://i.pravatar.cc/64?u=leo" alt="Avatar de Léo" />
          <span className="topbar__status" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
};
