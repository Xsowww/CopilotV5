import { useState } from "react";
import { PiCloudFill } from "react-icons/pi";
import { useAuth } from "../../context/AuthContext";

interface AuthPageProps {
  supabaseReady: boolean;
}

export const AuthPage = ({ supabaseReady }: AuthPageProps) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    if (!supabaseReady) {
      setFeedback("Veuillez configurer Supabase avant de vous connecter.");
      setSubmitting(false);
      return;
    }

    if (mode === "login") {
      const result = await signIn(email, password);
      if (result.error) {
        setFeedback(result.error);
      }
    } else {
      const result = await signUp(email, password, { full_name: fullName });
      if (result.error) {
        setFeedback(result.error);
      } else if (result.needsVerification) {
        setFeedback("Un e-mail de confirmation vient d'être envoyé. Merci de valider votre compte.");
      }
    }

    setSubmitting(false);
  };

  return (
    <main className="auth">
      <section className="auth__card" role="dialog" aria-labelledby="auth-title">
        <header className="auth__header">
          <PiCloudFill size={28} />
          <div>
            <p className="auth__subtitle">Copilot Espace Étudiant</p>
            <h1 id="auth-title">{mode === "login" ? "Connexion" : "Inscription"}</h1>
          </div>
        </header>
        {!supabaseReady && (
          <p className="auth__warning">
            Supabase n'est pas encore configuré. Ajoutez vos clés `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans un fichier
            `.env` puis redémarrez l'application.
          </p>
        )}
        <form className="auth__form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth__field">
              <span>Nom complet</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ex. Alex Martin"
                required
                autoComplete="name"
              />
            </label>
          )}
          <label className="auth__field">
            <span>Adresse e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="prenom.nom@exemple.fr"
              required
              autoComplete="email"
            />
          </label>
          <label className="auth__field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
            />
          </label>
          {feedback && <p className="auth__feedback">{feedback}</p>}
          <button className="auth__submit" type="submit" disabled={submitting}>
            {submitting ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form>
        <footer className="auth__footer">
          {mode === "login" ? (
            <button type="button" onClick={() => setMode("register")} className="auth__switch">
              Pas encore de compte ? Inscrivez-vous.
            </button>
          ) : (
            <button type="button" onClick={() => setMode("login")} className="auth__switch">
              Déjà inscrit ? Connectez-vous.
            </button>
          )}
        </footer>
      </section>
    </main>
  );
};
