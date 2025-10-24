import { useMemo } from "react";
import { ActivityWidget } from "../../components/widgets/ActivityWidget";
import { DriveWidget } from "../../components/widgets/DriveWidget";
import { NotesWidget } from "../../components/widgets/NotesWidget";
import { OrganisationWidget } from "../../components/widgets/OrganisationWidget";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { mockApi } from "../../services/mockApi";

export const DashboardPage = () => {
  const { data: driveData, loading: driveLoading } = useAutoRefresh({
    fetcher: mockApi.fetchDrive,
    interval: 60_000,
  });
  const { data: notesData, loading: notesLoading } = useAutoRefresh({
    fetcher: mockApi.fetchNotes,
    interval: 45_000,
  });
  const { data: organisationData, loading: organisationLoading } = useAutoRefresh({
    fetcher: mockApi.fetchOrganisation,
    interval: 75_000,
  });
  const { data: activityData, loading: activityLoading } = useAutoRefresh({
    fetcher: mockApi.fetchActivities,
    interval: 30_000,
  });

  const organisation = useMemo(
    () =>
      organisationData ?? {
        evenements: [],
        taches: [],
        rappels: [],
      },
    [organisationData]
  );

  return (
    <div className="dashboard-grid">
      <div className="dashboard-grid__column">
        <DriveWidget items={driveData ?? []} loading={driveLoading} />
        <NotesWidget notes={notesData ?? []} loading={notesLoading} />
      </div>
      <div className="dashboard-grid__column">
        <OrganisationWidget
          evenements={organisation.evenements}
          taches={organisation.taches}
          rappels={organisation.rappels}
          loading={organisationLoading}
        />
        <ActivityWidget
          activities={activityData ?? []}
          loading={activityLoading}
        />
      </div>
    </div>
  );
};
