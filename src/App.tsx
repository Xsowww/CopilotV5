import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { DrivePage } from "./pages/Drive/DrivePage";
import { NotesPage } from "./pages/Notes/NotesPage";
import { OrganisationPage } from "./pages/Organisation/OrganisationPage";

const App = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/drive" element={<DrivePage />} />
        <Route path="/organisation" element={<OrganisationPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default App;
