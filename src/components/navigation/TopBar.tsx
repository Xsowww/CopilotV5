import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PiBellSimpleFill, PiCloudFill } from "react-icons/pi";
import { useAppData } from "../../context/AppDataContext";

interface ProfileFormState {
  nom: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  statut?: string;
}

export const TopBar = () => {
  const date = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const { profile, updateProfile } = useAppData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    nom: profile.nom,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    statut: profile.statut,
  });
  const menuRef = useRef<HTMLDivElement | null>(null);

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
        <button type="button" className="topbar__action" aria-label="Notifications">
          <PiBellSimpleFill size={18} />
        </button>
        <div className="topbar__profile" ref={menuRef}>
          <button
            type="button"
            className="topbar__avatar"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
          >
            <img src={profile.avatarUrl} alt={`Avatar de ${profile.nom}`} />
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
