import { valueOf } from './stats';

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const stamp = () => new Date().toISOString().slice(0, 10);
export const MAX_NOTE = 500;

/** Clean one solve from untrusted data; returns null if it isn't usable. */
export function sanitizeSolve(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const t = Number(raw.t);
  if (!Number.isFinite(t) || t < 0 || typeof raw.s !== 'string') return null;
  const date = typeof raw.date === 'string' && !Number.isNaN(Date.parse(raw.date)) ? raw.date : new Date(0).toISOString();
  const solve = { id: typeof raw.id === 'string' && raw.id ? raw.id : newId(), t: Number(t.toFixed(3)), p: ['+2', 'dnf'].includes(raw.p) ? raw.p : '', s: raw.s.slice(0, 400), date };
  if (typeof raw.note === 'string' && raw.note.trim()) solve.note = raw.note.slice(0, MAX_NOTE);
  return solve;
}
export const byDate = (a, b) => Date.parse(a.date) - Date.parse(b.date);

export function buildBackup(solves, settings) {
  return { app: 'Cubiko', schema: 1, exportedAt: new Date().toISOString(), solves, settings };
}
/** Accepts a Cubiko (or CubeLab) backup, or a bare array of solves (the raw v5 localStorage data). */
export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  const rawSolves = Array.isArray(data) ? data : data?.solves;
  if (!Array.isArray(rawSolves)) throw new Error('No solves found in this file. Is it a Cubiko backup?');
  const solves = rawSolves.map(sanitizeSolve).filter(Boolean);
  if (!solves.length && rawSolves.length) throw new Error('None of the solves in this file could be read.');
  return { solves, settings: !Array.isArray(data) && data.settings && typeof data.settings === 'object' ? data.settings : null, skipped: rawSolves.length - solves.length };
}
/** Merge keeps what you have and adds solves whose id is missing; the result is in date order. */
export function mergeSolves(current, incoming) {
  const have = new Set(current.map(s => s.id));
  const added = incoming.filter(s => !have.has(s.id));
  return { merged: [...current, ...added].sort(byDate), added: added.length };
}

/* CSV: every field quoted; cells that start with = + - @ are prefixed so spreadsheets don't run them as formulas. */
const cell = value => {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
export function solvesToCsv(solves) {
  const rows = [['#', 'date', 'time_s', 'penalty', 'final_s', 'scramble', 'note']];
  solves.forEach((s, i) => {
    const v = valueOf(s);
    rows.push([i + 1, s.date, s.t.toFixed(2), s.p === 'dnf' ? 'DNF' : s.p, Number.isFinite(v) ? v.toFixed(2) : 'DNF', s.s, s.note || '']);
  });
  return '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n');
}

export function downloadFile(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const backupFilename = () => `cubiko-backup-${stamp()}.json`;
export const csvFilename = () => `cubiko-solves-${stamp()}.csv`;
