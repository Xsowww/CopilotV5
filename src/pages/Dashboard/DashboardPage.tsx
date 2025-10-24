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

const findContainerForWidget = (layout: WidgetLayout, widgetId: WidgetId) =>
  (layout.colonneGauche.includes(widgetId) ? "colonneGauche" : "colonneDroite") as keyof WidgetLayout;

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
      const overContainer = findContainerForWidget(prev, over.id as WidgetId);

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
      const overData = over.data?.current as { sortable?: { containerId?: keyof WidgetLayout } } | undefined;
      const containerFromSortable = overData?.sortable?.containerId as keyof WidgetLayout | undefined;
      const overContainer =
        containerFromSortable ??
        (prev.colonneGauche.includes(over.id as WidgetId)
          ? "colonneGauche"
          : prev.colonneDroite.includes(over.id as WidgetId)
            ? "colonneDroite"
            : undefined);
      if (!overContainer || activeContainer === overContainer) {
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
      .slice(0, 5);
  }, [drive]);

  const notesList = useMemo<Note[]>(() => {
    return Object.values(notes.notes)
      .sort((a, b) => b.misAJourLe.localeCompare(a.misAJourLe))
      .slice(0, 5);
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
