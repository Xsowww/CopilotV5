import { format, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export const formatRelativeDate = (isoDate: string) => {
  const date = parseISO(isoDate);
  if (isToday(date)) {
    return `Aujourd'hui · ${format(date, "HH'h'mm", { locale: fr })}`;
  }
  return format(date, "d MMM yyyy · HH'h'mm", { locale: fr });
};

export const formatCalendarDate = (isoDate: string) => {
  const date = parseISO(isoDate);
  return {
    jour: format(date, "d", { locale: fr }),
    mois: format(date, "MMM", { locale: fr }),
    heure: format(date, "HH'h'mm", { locale: fr }),
  };
};

export const formatWeight = (weight?: number) =>
  weight ? `${weight.toFixed(1).replace(".", ",")} Mo` : "-";
