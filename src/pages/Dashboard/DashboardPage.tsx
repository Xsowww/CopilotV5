import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { ActivityWidget } from "../../components/widgets/ActivityWidget";
import { DriveWidget } from "../../components/widgets/DriveWidget";
import { NotesWidget } from "../../components/widgets/NotesWidget";
import { OrganisationWidget } from "../../components/widgets/OrganisationWidget";
import { useAppData } from "../../context/AppDataContext";
import type { Note, WidgetId, WidgetLayout } from "../../types";
import type { ReactNode } from "react";

const columns: (keyof WidgetLayout)[] = ["colonneGauche", "colonneDroite"];

interface SortableWidgetProps {
  id: WidgetId;
  disabled: boolean;
  children: ReactNode;
}

const SortableWidget = ({ id, disabled, children }: SortableWidgetProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dashboard-widget ${isDragging ? "dashboard-widget--dragging" : ""}`.trim()}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

const cloneLayout = (layout: WidgetLayout): WidgetLayout => ({
  colonneGauche: [...layout.colonneGauche],
  colonneDroite: [...layout.colonneDroite],
});

// Modification : sécurisation du calcul de conteneur pour éviter le blocage du drag & drop.
const findContainerForWidget = (layout: WidgetLayout, widgetId: string | WidgetId):
  | keyof WidgetLayout
  | null => {
  if (layout.colonneGauche.includes(widgetId as WidgetId)) {
    return "colonneGauche";
  }
  if (layout.colonneDroite.includes(widgetId as WidgetId)) {
    return "colonneDroite";
  }
  return null;
};

const resolveOverContainer = (
  layout: WidgetLayout,
  over: DragEndEvent["over"] | DragOverEvent["over"]
): keyof WidgetLayout | null => {
  if (!over) return null;
  if (typeof over.id === "string") {
    const directMatch = findContainerForWidget(layout, over.id);
    if (directMatch) {
      return directMatch;
    }
  }
  const overData = over.data?.current as { sortable?: { containerId?: keyof WidgetLayout } } | undefined;
  return overData?.sortable?.containerId ?? null;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { drive, notes, organisation, activities, widgetLayout, saveWidgetLayout } = useAppData();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [localLayout, setLocalLayout] = useState<WidgetLayout>(() => cloneLayout(widgetLayout));
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isCustomizing) {
      setLocalLayout(cloneLayout(widgetLayout));
      setHasChanges(false);
    }
  }, [isCustomizing, widgetLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    setLocalLayout((prev) => {
      const activeContainer = findContainerForWidget(prev, active.id as WidgetId);
      const overContainer = resolveOverContainer(prev, over);

      if (!activeContainer || !overContainer) {
        return prev;
      }

      if (activeContainer === overContainer) {
        const items = [...prev[activeContainer]];
        const activeIndex = items.indexOf(active.id as WidgetId);
        const overIndex = items.indexOf(over.id as WidgetId);
        if (activeIndex !== overIndex) {
          const reordered = arrayMove(items, activeIndex, overIndex);
          const nextLayout = { ...prev, [activeContainer]: reordered };
          setHasChanges(JSON.stringify(nextLayout) !== JSON.stringify(widgetLayout));
          return nextLayout;
        }
        return prev;
      }

      return prev;
    });
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setLocalLayout((prev) => {
      const activeContainer = findContainerForWidget(prev, active.id as WidgetId);
      const overContainer = resolveOverContainer(prev, over);
      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return prev;
      }
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];
      const activeIndex = activeItems.indexOf(active.id as WidgetId);
      const item = activeItems[activeIndex];
      activeItems.splice(activeIndex, 1);
      const overIndex = overItems.indexOf(over.id as WidgetId);
      if (overIndex >= 0) {
        overItems.splice(overIndex, 0, item);
      } else {
        overItems.push(item);
      }
      const nextLayout: WidgetLayout = {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
      setHasChanges(JSON.stringify(nextLayout) !== JSON.stringify(widgetLayout));
      return nextLayout;
    });
  };

  const handleSaveLayout = () => {
    saveWidgetLayout(localLayout);
    setIsCustomizing(false);
  };

  const handleCancel = () => {
    setLocalLayout(cloneLayout(widgetLayout));
    setIsCustomizing(false);
  };

  const driveItems = useMemo(() => {
    const nodes = Object.values(drive.nodes);
    return nodes
      .filter((node) => node.id !== drive.rootId)
      .sort((a, b) => b.misAJourLe.localeCompare(a.misAJourLe))
      .slice(0, 3); // Modification : limiter l'aperçu pour conserver des widgets compacts.
  }, [drive]);

  const notesList = useMemo<Note[]>(() => {
    return Object.values(notes.notes)
      .sort((a, b) => b.misAJourLe.localeCompare(a.misAJourLe))
      .slice(0, 3); // Modification : limiter l'aperçu pour conserver des widgets compacts.
  }, [notes.notes]);

  const handleWidgetOpen = (widgetId: WidgetId) => {
    if (isCustomizing) return;
    switch (widgetId) {
      case "drive":
        navigate("/drive");
        break;
      case "notes":
        navigate("/notes");
        break;
      case "organisation":
        navigate("/organisation");
        break;
      case "activite":
        navigate("/organisation");
        break;
      default:
        break;
    }
  };

  const renderWidget = (widgetId: WidgetId) => {
    const commonProps = {
      onOpen: () => handleWidgetOpen(widgetId),
      disabled: isCustomizing,
    };

    switch (widgetId) {
      case "drive":
        return <DriveWidget items={driveItems} {...commonProps} />;
      case "notes":
        return <NotesWidget notes={notesList} folders={notes.folders} {...commonProps} />;
      case "organisation":
        return (
          <OrganisationWidget
            evenements={organisation.evenements}
            taches={organisation.taches}
            rappels={organisation.rappels}
            {...commonProps}
          />
        );
      case "activite":
        return <ActivityWidget activities={activities} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__actions">
        <button
          type="button"
          className={isCustomizing ? "btn-secondary" : "btn-primary"}
          onClick={() => setIsCustomizing((prev) => !prev)}
        >
          {isCustomizing ? "Quitter la personnalisation" : "Personnaliser le tableau de bord"}
        </button>
        {isCustomizing && (
          <div className="dashboard-page__actions-buttons">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Annuler
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!hasChanges}
              onClick={handleSaveLayout}
            >
              Sauvegarder
            </button>
          </div>
        )}
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div className={`dashboard-grid ${isCustomizing ? "dashboard-grid--editing" : ""}`}>
          {columns.map((column) => (
            <SortableContext key={column} items={localLayout[column]}>
              <div className="dashboard-grid__column" data-column={column}>
                {localLayout[column].map((widgetId) => (
                  <SortableWidget key={widgetId} id={widgetId} disabled={!isCustomizing}>
                    <div className={isCustomizing ? "widget-wrapper widget-wrapper--editing" : "widget-wrapper"}>
                      {renderWidget(widgetId)}
                      {isCustomizing && <span className="widget-wrapper__hint">Glisse pour réorganiser</span>}
                    </div>
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
          ))}
        </div>
      </DndContext>
    </div>
  );
};
