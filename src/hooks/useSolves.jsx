import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEY } from '../lib/settingsConfig';
import { MAX_NOTE, sanitizeSolve } from '../lib/backup';

const Ctx = createContext(null);
export const useSolves = () => useContext(Ctx);

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.map(sanitizeSolve).filter(Boolean) : [];
  } catch { return []; }
}
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function SolvesProvider({ children }) {
  const [solves, setSolves] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(solves)); } catch { /* storage full or blocked */ }
  }, [solves]);

  // Ask the browser not to evict our data when it is low on space (best effort).
  useEffect(() => { navigator.storage?.persist?.().catch(() => {}); }, []);

  const add = useCallback(({ t, p, s }) => {
    const solve = { id: newId(), t, p, s, date: new Date().toISOString() };
    setSolves(list => [...list, solve]);
    return solve;
  }, []);
  const update = useCallback((id, patch) => setSolves(list => list.map(s => (s.id === id ? { ...s, ...patch } : s))), []);
  const setPenalty = useCallback((id, p) => update(id, { p }), [update]);
  const setNote = useCallback((id, note) => setSolves(list => list.map(s => {
    if (s.id !== id) return s;
    const { note: _old, ...rest } = s;
    const clean = note.slice(0, MAX_NOTE).trim() ? note.slice(0, MAX_NOTE) : null;
    return clean ? { ...rest, note: clean } : rest;
  })), []);
  const remove = useCallback(id => setSolves(list => list.filter(s => s.id !== id)), []);
  const replaceAll = useCallback(next => setSolves(next), []);

  const value = useMemo(() => ({ solves, add, setPenalty, setNote, remove, replaceAll }), [solves, add, setPenalty, setNote, remove, replaceAll]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
