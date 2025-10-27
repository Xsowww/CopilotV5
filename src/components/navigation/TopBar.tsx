import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PiBellSimpleFill, PiCloudFill } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";

interface ProfileFormState {
  nom: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  statut?: string;
}

export const TopBar = () => {
  const date = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const { profile, updateProfile, organisation, isSyncing } = useAppData();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    nom: profile.nom,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    statut: profile.statut,
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const avatarSrc = profile.avatarUrl?.trim() ? profile.avatarUrl : "/vite.svg";

  const notifications = useMemo(() => {
    const items = [
      ...organisation.evenements.map((event) => ({
        id: event.id,
        titre: event.titre,
        type: "evenement" as const,
        date: event.date,
        info: event.heure ?? "Toute la journée",
      })),
      ...organisation.taches.map((task) => ({
        id: task.id,
        titre: task.titre,
        type: "tache" as const,
        date: task.echeance,
        info: `Priorité ${task.priorite}`,
      })),
      ...organisation.rappels.map((reminder) => ({
        id: reminder.id,
        titre: reminder.titre,
        type: "rappel" as const,
        date: reminder.date,
        info: reminder.description ?? "",
      })),
    ];
    return items
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [organisation]);

  useEffect(() => {
    setForm({
      nom: profile.nom,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      statut: profile.statut,
    });
  }, [profile]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      window.addEventListener("click", handleClick);
    }
    return () => window.removeEventListener("click", handleClick);
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      window.addEventListener("click", handleClick);
      window.addEventListener("keydown", handleKey);
    }
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isNotificationsOpen]);

  const handleChange = <Key extends keyof ProfileFormState>(key: Key, value: ProfileFormState[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(form);
    setIsMenuOpen(false);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <PiCloudFill size={26} />
        <div>
          <p className="topbar__subtitle">Bienvenue, {profile.nom.split(" ")[0]}</p>
          <h1 className="topbar__title">Tableau de bord étudiant</h1>
        </div>
      </div>
      <div className="topbar__right">
        <span className="topbar__date">{date}</span>
        {isSyncing && <span className="topbar__sync">Synchronisation…</span>}
        <div className="topbar__notifications" ref={notificationsRef}>
          <button
            type="button"
            className={`topbar__action ${isNotificationsOpen ? "topbar__action--active" : ""}`.trim()}
            aria-label="Notifications"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsMenuOpen(false);
            }}
          >
            <PiBellSimpleFill size={18} />
          </button>
          {isNotificationsOpen && (
            <div className="notification-panel" role="dialog" aria-label="Notifications récentes">
              <header>
                <h3>Notifications</h3>
                <span>{notifications.length === 0 ? "Aucune alerte" : `${notifications.length} à suivre`}</span>
              </header>
              {notifications.length === 0 ? (
                <p className="notification-panel__empty">Rien à signaler pour le moment.</p>
              ) : (
                <ul>
                  {notifications.map((item) => {
                    const targetDate = format(new Date(item.date), "d MMM", { locale: fr });
                    const typeLabel =
                      item.type === "evenement"
                        ? "Événement"
                        : item.type === "tache"
                          ? "Tâche"
                          : "Rappel";
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          className="notification-panel__item"
                          onClick={() => {
                            // Modification : accès direct depuis le panneau de notifications.
                            setIsNotificationsOpen(false);
                            navigate("/organisation", {
                              state: { focusOrganisation: { type: item.type, id: item.id } },
                            });
                          }}
                        >
                          <div>
                            <strong>{item.titre}</strong>
                            <span>{typeLabel}</span>
                          </div>
                          <div className="notification-panel__meta">
                            <span>{targetDate}</span>
                            {item.info && <span>{item.info}</span>}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="topbar__profile" ref={menuRef}>
          <button
            type="button"
            className="topbar__avatar"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
          >
            <img src={avatarSrc} alt={`Avatar de ${profile.nom}`} />
            <span className="topbar__status" aria-hidden="true" />
          </button>
          {isMenuOpen && (
            <div className="profile-menu" role="dialog" aria-label="Profil utilisateur">
              <h3>Profil utilisateur</h3>
              <form onSubmit={handleSubmit}>
                <label>
                  Nom complet
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(event) => handleChange("nom", event.target.value)}
                  />
                </label>
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                  />
                </label>
                <label>
                  Lien de la photo
                  <input
                    type="url"
                    value={form.avatarUrl}
                    onChange={(event) => handleChange("avatarUrl", event.target.value)}
                  />
                </label>
                <label>
                  Statut
                  <input
                    type="text"
                    value={form.statut ?? ""}
                    placeholder="Disponible, En réunion…"
                    onChange={(event) => handleChange("statut", event.target.value)}
                  />
                </label>
                <label>
                  Bio
                  <textarea
                    value={form.bio ?? ""}
                    onChange={(event) => handleChange("bio", event.target.value)}
                    rows={3}
                  />
                </label>
                <div className="profile-menu__actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsMenuOpen(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Enregistrer
                  </button>
                </div>
              </form>
              <button
                type="button"
                className="profile-menu__signout"
                onClick={() => {
                  setIsMenuOpen(false);
                  void signOut();
                }}
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
