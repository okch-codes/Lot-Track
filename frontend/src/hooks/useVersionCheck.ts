import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchBuildTime(): Promise<string | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.buildTime ?? null;
  } catch {
    return null;
  }
}

export function useVersionCheck(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const baselineRef = useRef<string | null>(null);

  useEffect(() => {
    fetchBuildTime().then((buildTime) => {
      baselineRef.current = buildTime;
    });

    const interval = setInterval(async () => {
      const buildTime = await fetchBuildTime();
      if (buildTime && baselineRef.current && buildTime !== baselineRef.current) {
        setUpdateAvailable(true);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return updateAvailable;
}
