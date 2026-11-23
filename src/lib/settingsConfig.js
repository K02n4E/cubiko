export const STORAGE_KEY = 'cubelab-solves-v1';   // same keys as v5, so data in the same origin carries over
export const SETTINGS_KEY = 'cubelab-settings-v1';

export const ACCENTS = { cyan:['#22D3EE','#0891B2'], blue:['#60A5FA','#2563EB'], violet:['#A78BFA','#7C3AED'], pink:['#F472B6','#DB2777'], orange:['#FB923C','#EA580C'], green:['#4ADE80','#16A34A'] };
export const SIZES = { Small:'clamp(56px,12vw,100px)', Medium:'', Large:'clamp(88px,20vw,180px)' };
export const PALETTES = [['midnight', 'Midnight', '#1E293B'], ['graphite', 'Graphite', '#3A3C3F'], ['ocean', 'Ocean', '#16384A'], ['plum', 'Plum', '#2C2150'], ['forest', 'Forest', '#1C3328']];

export const DEFAULTS = {
  theme: 'dark', palette: 'midnight', accent: 'cyan', corners: 'soft', tfont: 'sans', size: 'Medium',
  preview: true, precision: 2, hideTimer: false, inspection: false, sound: true,
  // race
  raceMode: 'alternate',   // 'alternate' (you, then the bot) | 'together' (both at once)
  hideBotTime: false,      // hide the bot's time until the round is decided
  raceBestOf: 3, raceLevel: 20,
  // data
  lastBackup: null
};
export const APPEARANCE_KEYS = ['theme', 'palette', 'accent', 'corners', 'tfont', 'size', 'preview'];

const hexToRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const toHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const luminance = hex => {
  const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function accentColor(settings) {
  const light = settings.theme === 'light';
  if (ACCENTS[settings.accent]) return ACCENTS[settings.accent][light ? 1 : 0];
  const base = /^#[0-9a-f]{6}$/i.test(settings.accent) ? settings.accent : ACCENTS.cyan[0];
  return light ? toHex(hexToRgb(base).map(v => v * 0.78)) : base; // darken custom colors on the light theme
}

/** Keep only known keys with the right type, so a bad file or old data can't break the app. */
export function sanitizeSettings(input) {
  const out = { ...DEFAULTS };
  if (!input || typeof input !== 'object') return out;
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in input)) continue;
    const want = DEFAULTS[key], got = input[key];
    if (key === 'lastBackup') out[key] = typeof got === 'string' ? got : null;
    else if (typeof got === typeof want) out[key] = got;
  }
  if (!['dark', 'light'].includes(out.theme)) out.theme = 'dark';
  if (![1, 2, 3].includes(out.precision)) out.precision = 2;
  if (!['alternate', 'together'].includes(out.raceMode)) out.raceMode = 'alternate';
  if (![1, 3, 5, 7, 9].includes(out.raceBestOf)) out.raceBestOf = 3;
  if (![20, 15, 12, 10, 7, 5].includes(out.raceLevel)) out.raceLevel = 20;
  return out;
}
