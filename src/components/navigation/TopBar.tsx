import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  notificationsActives: boolean;
}

interface NotificationEntry {
  key: string;
  id: string;
  titre: string;
  type: "evenement" | "tache" | "rappel" | "systeme";
  date: string;
  info?: string;
  target?: { route: string; state?: unknown };
}

const isDomReady = typeof document !== "undefined";

export const TopBar = () => {
  const date = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const { profile, updateProfile, organisation, isSyncing, notifications: systemNotifications, markNotificationsAsRead } =
    useAppData();
  const { signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    nom: profile.nom,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    statut: profile.statut,
    notificationsActives: profile.notificationsActives,
  });
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  // Ajout : suivi des notifications non lues pour piloter pastille et alerte sonore.
  const knownNotificationsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const [unreadKeys, setUnreadKeys] = useState<Set<string>>(new Set<string>());
  const hydratedNotificationsRef = useRef(false);
  const [toast, setToast] = useState<{ key: string; titre: string; type: string } | null>(null);
  const navigate = useNavigate();
  const avatarSrc = profile.avatarUrl?.trim() ? profile.avatarUrl : "/vite.svg";

  const playNotificationSound = useCallback(() => {
    if (!profile.notificationsActives) {
      return;
    }
    try {
      const AudioCtor =
        window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        return;
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtor();
      }
      const context = audioContextRef.current;
      if (context.state === "suspended") {
        void context.resume();
      }
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      oscillator.connect(gain);
      gain.connect(context.destination);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
      oscillator.start(now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      oscillator.stop(now + 0.5);
    } catch (error) {
      // Ignorer silencieusement si l'API Audio n'est pas disponible.
    }
  }, [profile.notificationsActives]);

  // Mise à jour : fusionne les notifications système Supabase et les éléments Organisation pour un flux unifié.
  const notifications = useMemo<NotificationEntry[]>(() => {
    const base: NotificationEntry[] = [
      ...systemNotifications
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((item) => ({
          key: `system-${item.id}`,
          id: item.id,
          titre: item.titre,
          type: "systeme" as const,
          date: item.date,
          info: item.message,
        })),
      ...organisation.evenements.map((event) => ({
        key: `evenement-${event.id}`,
        id: event.id,
        titre: event.titre,
        type: "evenement" as const,
        date: event.date,
        info: event.heure ?? "Toute la journée",
        target: { route: "/organisation", state: { focusOrganisation: { type: "evenement" as const, id: event.id } } },
      })),
      ...organisation.taches.map((task) => ({
        key: `tache-${task.id}`,
        id: task.id,
        titre: task.titre,
        type: "tache" as const,
        date: task.echeance,
        info: `Priorité ${task.priorite}`,
        target: { route: "/organisation", state: { focusOrganisation: { type: "tache" as const, id: task.id } } },
      })),
      ...organisation.rappels.map((reminder) => ({
        key: `rappel-${reminder.id}`,
        id: reminder.id,
        titre: reminder.titre,
        type: "rappel" as const,
        date: reminder.date,
        info: reminder.description ?? "",
        target: { route: "/organisation", state: { focusOrganisation: { type: "rappel" as const, id: reminder.id } } },
      })),
    ];
    return base
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [organisation.evenements, organisation.rappels, organisation.taches, systemNotifications]);
  const hasUnread = unreadKeys.size > 0;

  useEffect(() => {
    setForm({
      nom: profile.nom,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      statut: profile.statut,
      notificationsActives: profile.notificationsActives,
    });
  }, [profile]);

  useEffect(() => {
    const currentKeys = new Set(notifications.map((item) => item.key));
    if (!hydratedNotificationsRef.current) {
      knownNotificationsRef.current = currentKeys;
      hydratedNotificationsRef.current = true;
      setUnreadKeys(new Set<string>());
      return;
    }

    const previousKeys = knownNotificationsRef.current;
    const newKeys = notifications
      .filter((item) => !previousKeys.has(item.key))
      .map((item) => item.key);

    knownNotificationsRef.current = currentKeys;

    setUnreadKeys((prev) => {
      const next = new Set(prev);
      newKeys.forEach((key) => {
        next.add(key);
      });
      [...next].forEach((key) => {
        if (!currentKeys.has(key)) {
          next.delete(key);
        }
      });
      return next;
    });

    if (profile.notificationsActives && newKeys.length > 0) {
      playNotificationSound();
      const freshest = notifications.find((item) => item.key === newKeys[0]);
      if (freshest) {
        setToast({ key: freshest.key, titre: freshest.titre, type: freshest.type });
      }
    }
  }, [notifications, profile.notificationsActives, playNotificationSound]);

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

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }
    setUnreadKeys(new Set<string>());
    markNotificationsAsRead();
  }, [isNotificationsOpen, markNotificationsAsRead]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    // Mise à jour : garder la notification visuelle affichée 5 secondes pour mimer une alerte mobile.
    const timeout = window.setTimeout(() => setToast(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!profile.notificationsActives) {
      setToast(null);
    }
  }, [profile.notificationsActives]);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isProfileOpen]);

  const handleChange = <Key extends keyof ProfileFormState>(key: Key, value: ProfileFormState[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(form);
    setIsProfileOpen(false);
  };

  const renderProfileDialog = () => {
    if (!isProfileOpen || !isDomReady) {
      return null;
    }
    // Modification : transformation du profil en fenêtre modale cohérente avec le design global.
    return createPortal(
      <div
        className="dialog-overlay profile-dialog__overlay"
        role="presentation"
        onClick={() => setIsProfileOpen(false)}
      >
        <div
          className="profile-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Profil utilisateur"
          onClick={(event) => event.stopPropagation()}
        >
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
            <label className="profile-dialog__toggle">
              <input
                type="checkbox"
                checked={form.notificationsActives}
                onChange={(event) => handleChange("notificationsActives", event.target.checked)}
              />
              Notifications (son & pop-up)
            </label>
            <div className="profile-dialog__actions">
              <button type="button" className="btn-secondary" onClick={() => setIsProfileOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Enregistrer
              </button>
            </div>
          </form>
          <button
            type="button"
            className="profile-dialog__signout"
            onClick={() => {
              setIsProfileOpen(false);
              void signOut();
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
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
              data-unread={hasUnread ? "true" : "false"}
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                setIsProfileOpen(false);
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
                          : item.type === "rappel"
                            ? "Rappel"
                            : "Notification";
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          className="notification-panel__item"
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            if (item.target) {
                              navigate(item.target.route, { state: item.target.state });
                            }
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
        <div className="topbar__profile">
          <button
            type="button"
            className="topbar__avatar"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
            aria-haspopup="dialog"
            aria-expanded={isProfileOpen}
          >
            <img src={avatarSrc} alt={`Avatar de ${profile.nom}`} />
            <span className="topbar__status" aria-hidden="true" />
          </button>
          {renderProfileDialog()}
        </div>
      </div>
      </header>
      {toast && profile.notificationsActives && (
        <div className="notification-toast" role="status" aria-live="polite">
          <span className={`notification-toast__type notification-toast__type--${toast.type}`}>
            Nouvelle notification
          </span>
          <strong>{toast.titre}</strong>
        </div>
      )}
    </>
  );
};
