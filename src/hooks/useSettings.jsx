import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ACCENTS, APPEARANCE_KEYS, DEFAULTS, SETTINGS_KEY, accentColor, luminance, sanitizeSettings } from '../lib/settingsConfig';

const Ctx = createContext(null);
export const useSettings = () => useContext(Ctx);

function load() {
  try { return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch { return { ...DEFAULTS }; }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage full or blocked */ } }, [settings]);

  useEffect(() => {
    const root = document.documentElement, accent = accentColor(settings);
    root.dataset.theme = settings.theme; root.dataset.palette = settings.palette;
    root.dataset.corners = settings.corners; root.dataset.tfont = settings.tfont;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--on-accent', luminance(accent) > 0.4 ? '#0B1120' : '#FFFFFF');
    document.body.classList.toggle('no-net', !settings.preview);
  }, [settings]);

  const set = useCallback((key, value) => setSettings(s => ({ ...s, [key]: value })), []);
  const resetLook = useCallback(() => setSettings(s => ({ ...s, ...Object.fromEntries(APPEARANCE_KEYS.map(k => [k, DEFAULTS[k]])) })), []);
  const replaceAll = useCallback(next => setSettings(s => ({ ...sanitizeSettings(next), lastBackup: s.lastBackup })), []);
  const value = useMemo(() => ({ settings, set, resetLook, replaceAll }), [settings, set, resetLook, replaceAll]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export { ACCENTS };
