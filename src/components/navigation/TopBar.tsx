import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PiBellSimpleFill, PiCloudFill } from "react-icons/pi";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppData } from "../../context/AppDataContext";

interface NotificationEntry {
  key: string;
  id: string;
  titre: string;
  type: "evenement" | "tache" | "rappel" | "systeme";
  date: string;
  info?: string;
  target?: { route: string; state?: unknown };
}

export const TopBar = () => {
  const date = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const { profile, organisation, isSyncing, notifications: systemNotifications, markNotificationsAsRead } = useAppData();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  // Ajout : suivi des notifications non lues pour piloter pastille et alerte sonore.
  const knownNotificationsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const [unreadKeys, setUnreadKeys] = useState<Set<string>>(new Set<string>());
  const hydratedNotificationsRef = useRef(false);
  const [toast, setToast] = useState<{ key: string; titre: string; type: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const avatarSrc = profile.avatarUrl?.trim() ? profile.avatarUrl : "/vite.svg";

  const { headerTitle, headerSubtitle } = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/drive")) {
      return { headerTitle: "Drive", headerSubtitle: "Votre espace de fichiers" };
    }
    if (path.startsWith("/organisation")) {
      return { headerTitle: "Organisation", headerSubtitle: "Calendrier et rappels" };
    }
    if (path.startsWith("/notes")) {
      return { headerTitle: "Notes", headerSubtitle: "Carnets et dossiers" };
    }
    if (path.startsWith("/profil")) {
      return { headerTitle: "Profil", headerSubtitle: "Gérez vos informations" };
    }
    return { headerTitle: "Tableau de bord étudiant", headerSubtitle: `Bienvenue, ${profile.nom.split(" ")[0]}` };
  }, [location.pathname, profile.nom]);

  const playNotificationSound = useCallback(() => {
    if (!profile.notificationsActives || profile.modeConcentration) {
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

    if (profile.notificationsActives && !profile.modeConcentration && newKeys.length > 0) {
      playNotificationSound();
      const freshest = notifications.find((item) => item.key === newKeys[0]);
      if (freshest) {
        setToast({ key: freshest.key, titre: freshest.titre, type: freshest.type });
      }
    }
  }, [notifications, profile.modeConcentration, profile.notificationsActives, playNotificationSound]);

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
    // Modification : garder la notification visuelle affichée 5 secondes pour mimer une alerte mobile.
    const timeout = window.setTimeout(() => setToast(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!profile.notificationsActives) {
      setToast(null);
    }
  }, [profile.notificationsActives]);

  useEffect(() => {
    if (profile.modeConcentration) {
      setToast(null);
    }
  }, [profile.modeConcentration]);

  const isBrowser = typeof document !== "undefined";

  return (
    <>
      <header className="topbar">
        <div className="topbar__left">
          <PiCloudFill size={26} />
          <div>
            <p className="topbar__subtitle">{headerSubtitle}</p>
            <h1 className="topbar__title">{headerTitle}</h1>
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
                // Modification : redirection vers l'espace Profil en plein écran.
                setIsNotificationsOpen(false);
                navigate("/profil");
              }}
              aria-haspopup="true"
              aria-expanded={false}
            >
              <img src={avatarSrc} alt={`Avatar de ${profile.nom}`} />
              <span className="topbar__status" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      {toast && profile.notificationsActives && !profile.modeConcentration && isBrowser
        ? createPortal(
            <div className="notification-toast" role="status" aria-live="polite">
              <span className={`notification-toast__type notification-toast__type--${toast.type}`}>
                Nouvelle notification
              </span>
              <strong>{toast.titre}</strong>
            </div>,
            document.body
          )
        : null}
    </>
  );
};
