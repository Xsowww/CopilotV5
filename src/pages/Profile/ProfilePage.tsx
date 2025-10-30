import { useEffect, useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import type { UserProfile } from "../../types";

// Nouvelle page : panneau Profil plein écran avec préférences détaillées.
export const ProfilePage = () => {
  const { profile, updateProfile } = useAppData();
  const { signOut } = useAuth();
  const [form, setForm] = useState<Pick<
    UserProfile,
    "nom" | "email" | "avatarUrl" | "bio" | "statut" | "notificationsActives" | "modeConcentration" | "partageActivite"
  >>({
    nom: profile.nom,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    statut: profile.statut,
    notificationsActives: profile.notificationsActives,
    modeConcentration: profile.modeConcentration ?? false,
    partageActivite: profile.partageActivite ?? true,
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setForm({
      nom: profile.nom,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      statut: profile.statut,
      notificationsActives: profile.notificationsActives,
      modeConcentration: profile.modeConcentration ?? false,
      partageActivite: profile.partageActivite ?? true,
    });
    setIsDirty(false);
  }, [profile]);

  const handleChange = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      setIsDirty(true);
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(form);
    setIsDirty(false);
  };

  const resetForm = () => {
    setForm({
      nom: profile.nom,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      statut: profile.statut,
      notificationsActives: profile.notificationsActives,
      modeConcentration: profile.modeConcentration ?? false,
      partageActivite: profile.partageActivite ?? true,
    });
    setIsDirty(false);
  };

  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <div className="profile-page__identity">
          <div className="profile-page__avatar">
            <img src={form.avatarUrl?.trim() ? form.avatarUrl : "/vite.svg"} alt="Avatar utilisateur" />
          </div>
          <div>
            <h2>Profil</h2>
            <p>Personnalisez vos informations et vos préférences de notifications.</p>
          </div>
        </div>
        <div className="profile-page__actions">
          <button type="button" className="btn-secondary" onClick={resetForm}>
            Réinitialiser
          </button>
          <button type="submit" form="profile-form" className="btn-primary" disabled={!isDirty}>
            Enregistrer
          </button>
        </div>
      </header>

      <form id="profile-form" className="profile-page__form" onSubmit={handleSubmit}>
        <section className="profile-section">
          <h3>Informations personnelles</h3>
          <div className="profile-section__grid">
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
              Lien de l'avatar
              <input
                type="url"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(event) => handleChange("avatarUrl", event.target.value)}
              />
            </label>
            <label>
              Statut
              <input
                type="text"
                placeholder="Disponible, En cours de travail…"
                value={form.statut ?? ""}
                onChange={(event) => handleChange("statut", event.target.value)}
              />
            </label>
            <label className="profile-section__full">
              Bio
              <textarea
                rows={3}
                value={form.bio ?? ""}
                onChange={(event) => handleChange("bio", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="profile-section">
          <h3>Préférences</h3>
          <div className="profile-section__toggles">
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.notificationsActives}
                onChange={(event) => handleChange("notificationsActives", event.target.checked)}
              />
              <span>Activer les notifications sonores et visuelles</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.modeConcentration ?? false}
                onChange={(event) => handleChange("modeConcentration", event.target.checked)}
              />
              <span>Mode concentration (réduit les alertes non critiques)</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.partageActivite ?? true}
                onChange={(event) => handleChange("partageActivite", event.target.checked)}
              />
              <span>Partager mes activités récentes sur le tableau de bord</span>
            </label>
          </div>
        </section>
      </form>

      <section className="profile-section profile-section--danger">
        <div>
          <h3>Fin de session</h3>
          <p>Déconnectez-vous de Copilot sur cet appareil.</p>
        </div>
        <button type="button" className="btn-danger" onClick={() => void signOut()}>
          Se déconnecter
        </button>
      </section>
    </div>
  );
};
