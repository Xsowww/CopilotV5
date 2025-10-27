import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { ActivityWidget } from "../../components/widgets/ActivityWidget";
import { DriveWidget } from "../../components/widgets/DriveWidget";
import { NotesWidget } from "../../components/widgets/NotesWidget";
import { OrganisationWidget } from "../../components/widgets/OrganisationWidget";
import { useAppData } from "../../context/AppDataContext";
import type {
  DriveNode,
  Evenement,
  Note,
  Rappel,
  Tache,
  WidgetActivity,
  WidgetId,
  WidgetLayout,
} from "../../types";
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

interface SortableColumnProps {
  column: keyof WidgetLayout;
  items: WidgetId[];
  isCustomizing: boolean;
  renderWidget: (widgetId: WidgetId) => ReactNode;
}

const SortableColumn = ({ column, items, isCustomizing, renderWidget }: SortableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const showPlaceholder = isCustomizing && items.length === 0;
  return (
    <SortableContext items={items}>
      <div
        ref={setNodeRef}
        className={`dashboard-grid__column ${isOver ? "dashboard-grid__column--active" : ""}`.trim()}
        data-column={column}
      >
        {items.map((widgetId) => (
          <SortableWidget key={widgetId} id={widgetId} disabled={!isCustomizing}>
            <div className={isCustomizing ? "widget-wrapper widget-wrapper--editing" : "widget-wrapper"}>
              {renderWidget(widgetId)}
              {isCustomizing && <span className="widget-wrapper__hint">Glisse pour réorganiser</span>}
            </div>
          </SortableWidget>
        ))}
        {showPlaceholder && <div className="dashboard-grid__placeholder">Dépose ici</div>}
      </div>
    </SortableContext>
  );
};

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
    if (over.id === "colonneGauche" || over.id === "colonneDroite") {
      return over.id as keyof WidgetLayout;
    }
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
  // Mise à jour : limiter chaque widget à un seul élément pour éviter tout débordement visuel.
  const MAX_WIDGET_ITEMS = 1;

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
        if (activeIndex === -1) {
          return prev;
        }
        const targetIndex = overIndex >= 0 ? overIndex : items.length - 1;
        if (activeIndex !== targetIndex) {
          const reordered = arrayMove(items, activeIndex, targetIndex);
          const nextLayout = { ...prev, [activeContainer]: reordered };
          setHasChanges(JSON.stringify(nextLayout) !== JSON.stringify(widgetLayout));
          return nextLayout;
        }
        return prev;
      }

      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];
      const activeIndex = activeItems.indexOf(active.id as WidgetId);
      if (activeIndex === -1) {
        return prev;
      }
      const [moved] = activeItems.splice(activeIndex, 1);
      const overIndex = overItems.indexOf(over.id as WidgetId);
      if (overIndex >= 0) {
        overItems.splice(overIndex, 0, moved);
      } else {
        overItems.push(moved);
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
      .slice(0, MAX_WIDGET_ITEMS); // Modification : limiter l'aperçu pour conserver des widgets compacts.
  }, [drive]);

  const notesList = useMemo<Note[]>(() => {
    return Object.values(notes.notes)
      .sort((a, b) => b.misAJourLe.localeCompare(a.misAJourLe))
      .slice(0, MAX_WIDGET_ITEMS); // Modification : limiter l'aperçu pour conserver des widgets compacts.
  }, [notes.notes]);

  const activityHighlights = useMemo(() => activities.slice(0, MAX_WIDGET_ITEMS), [activities]);

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

  const handleDriveItemNavigate = (item: DriveNode) => {
    if (isCustomizing) return;
    // Modification : navigation directe vers l'élément Drive sélectionné depuis le widget.
    navigate("/drive", { state: { focusDriveId: item.id, focusDriveType: item.type } });
  };

  const handleNoteNavigate = (note: Note) => {
    if (isCustomizing) return;
    // Modification : navigation directe vers la note sélectionnée depuis le widget.
    navigate("/notes", { state: { focusNoteId: note.id } });
  };

  const handleOrganisationNavigate = (payload: { type: "evenement" | "tache" | "rappel"; id: string }) => {
    if (isCustomizing) return;
    // Modification : navigation directe vers l'événement, la tâche ou le rappel affiché dans le widget Organisation.
    navigate("/organisation", { state: { focusOrganisation: payload } });
  };

  const handleActivityNavigate = (activity: WidgetActivity) => {
    if (isCustomizing) return;
    const target =
      activity.type === "drive"
        ? "/drive"
        : activity.type === "organisation"
          ? "/organisation"
          : "/notes";
    navigate(target);
  };

  const renderWidget = (widgetId: WidgetId) => {
    const commonProps = {
      onOpen: () => handleWidgetOpen(widgetId),
      disabled: isCustomizing,
    };

    switch (widgetId) {
      case "drive":
        return <DriveWidget items={driveItems} onItemNavigate={handleDriveItemNavigate} {...commonProps} />;
      case "notes":
        return (
          <NotesWidget
            notes={notesList}
            folders={notes.folders}
            onItemNavigate={handleNoteNavigate}
            {...commonProps}
          />
        );
      case "organisation":
        return (
          <OrganisationWidget
            evenements={organisation.evenements}
            taches={organisation.taches}
            rappels={organisation.rappels}
            onEvenementNavigate={(evenement: Evenement) =>
              handleOrganisationNavigate({ type: "evenement", id: evenement.id })
            }
            onTacheNavigate={(tache: Tache) => handleOrganisationNavigate({ type: "tache", id: tache.id })}
            onRappelNavigate={(rappel: Rappel) => handleOrganisationNavigate({ type: "rappel", id: rappel.id })}
            {...commonProps}
          />
        );
      case "activite":
        return (
          <ActivityWidget
            activities={activityHighlights}
            onActivityNavigate={handleActivityNavigate}
            {...commonProps}
          />
        );
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
            <SortableColumn
              key={column}
              column={column}
              items={localLayout[column]}
              isCustomizing={isCustomizing}
              renderWidget={renderWidget}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};
