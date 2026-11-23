import { useEffect, useState } from 'react';

export const PAGES = ['timer', 'race', 'trainer', 'statistics', 'prefs'];
const read = () => { const p = location.hash.slice(1); return PAGES.includes(p) ? p : 'timer'; };

export function useHashRoute() {
  const [page, setPage] = useState(read);
  useEffect(() => {
    const onChange = () => setPage(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return page;
}
