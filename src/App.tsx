import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { DrivePage } from "./pages/Drive/DrivePage";
import { NotesPage } from "./pages/Notes/NotesPage";
import { OrganisationPage } from "./pages/Organisation/OrganisationPage";
import { AuthPage } from "./pages/Auth/AuthPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";

const App = () => {
  const { user, loading, isSupabaseConfigured } = useAuth();

  if (loading) {
    return (
      <div className="app__loading">
        <p>Chargement en cours…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage supabaseReady={isSupabaseConfigured} />;
  }

  return (
    <AppDataProvider user={user}>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/drive" element={<DrivePage />} />
          <Route path="/organisation" element={<OrganisationPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
    </AppDataProvider>
  );
};

export default App;
