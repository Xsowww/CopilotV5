import { useEffect, useState } from "react";
import { PiCloudArrowUpFill, PiFolderPlusFill } from "react-icons/pi";
import type { DriveItem } from "../../types";
import { mockApi } from "../../services/mockApi";
import { formatRelativeDate, formatWeight } from "../../utils/formatters";

export const DrivePage = () => {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.fetchDrive().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="drive-page">
      <header className="drive-page__header">
        <div>
          <h2>Drive</h2>
          <p>Retrouve tous tes fichiers et dossiers organisés comme sur iCloud.</p>
        </div>
        <div className="drive-page__actions">
          <button type="button" className="btn-secondary">
            <PiFolderPlusFill size={16} /> Nouveau dossier
          </button>
          <button type="button" className="btn-primary">
            <PiCloudArrowUpFill size={16} /> Importer
          </button>
        </div>
      </header>

      <div className="drive-table" role="grid" aria-busy={loading}>
        <div className="drive-table__header" role="row">
          <span>Nom</span>
          <span>Dernière modification</span>
          <span>Taille</span>
          <span>Partage</span>
        </div>
        <div className="drive-table__body">
          {loading ? (
            <p className="widget-card__empty">Chargement…</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="drive-table__row" role="row">
                <span>{item.nom}</span>
                <span>{formatRelativeDate(item.derniereModification)}</span>
                <span>{formatWeight(item.poidsMo)}</span>
                <span>{item.partage ? "Partagé" : "Privé"}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
