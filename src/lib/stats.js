export const valueOf = solve => (solve.p === 'dnf' ? Infinity : solve.t + (solve.p === '+2' ? 2 : 0));

export function format(value, decimals = 2) {
  if (value === Infinity) return 'DNF';
  if (value == null || !Number.isFinite(value)) return '–';
  if (value >= 60) return `${Math.floor(value / 60)}:${(value % 60).toFixed(decimals).padStart(decimals ? decimals + 3 : 2, '0')}`;
  return value.toFixed(decimals);
}
export const formatSolve = (solve, decimals = 2) => (solve.p === 'dnf' ? 'DNF' : format(valueOf(solve), decimals));

export function average(list, count) {
  if (list.length < count) return null;
  const times = list.slice(-count).map(valueOf).sort((a, b) => a - b);
  const trim = Math.ceil(count * 0.05);
  const trimmed = times.slice(trim, count - trim);
  return trimmed.some(v => !Number.isFinite(v)) ? Infinity : trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}
/** Average of `count` ending at index `index` (what the Ao was right after that solve). */
export const averageAt = (list, index, count) => average(list.slice(0, index + 1), count);
export const best = list => (list.length ? Math.min(...list.map(valueOf)) : null);
export function mean(list) {
  if (!list.length) return null;
  const times = list.map(valueOf);
  return times.some(v => !Number.isFinite(v)) ? Infinity : times.reduce((a, b) => a + b, 0) / times.length;
}
/** A new fastest/slowest solve compared with earlier ones (needs at least one earlier solve). */
export function checkRecords(earlierSolves, solve) {
  const earlier = earlierSolves.map(valueOf).filter(Number.isFinite), value = valueOf(solve);
  if (!earlier.length || !Number.isFinite(value)) return null;
  if (value < Math.min(...earlier)) return { type: 'pb', diff: Math.min(...earlier) - value };
  if (value > Math.max(...earlier)) return { type: 'slow', diff: value - Math.max(...earlier) };
  return null;
}
