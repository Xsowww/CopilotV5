import { useEffect, useState } from "react";

interface Options<T> {
  fetcher: () => Promise<T>;
  interval?: number;
}

export const useAutoRefresh = <T,>({ fetcher, interval = 60_000 }: Options<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    let timeout: number;

    const load = async () => {
      setLoading(true);
      try {
        const result = await fetcher();
        if (!ignore) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError("Impossible de récupérer les données");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          timeout = window.setTimeout(load, interval);
        }
      }
    };

    load();

    return () => {
      ignore = true;
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [fetcher, interval]);

  return { data, loading, error };
};
