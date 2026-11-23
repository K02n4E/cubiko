import { useRef, useState } from 'react';
import { Chips, SettingRow, Seg, Switch } from '../components/Controls';
import ImportDialog from '../components/ImportDialog';
import { useSettings } from '../hooks/useSettings';
import { useSolves } from '../hooks/useSolves';
import { useToast } from '../hooks/useToast';
import { ACCENTS, PALETTES } from '../lib/settingsConfig';
import { announceInspection, unlockAudio } from '../lib/audio';
import { backupFilename, buildBackup, byDate, csvFilename, downloadFile, mergeSolves, parseBackup, solvesToCsv } from '../lib/backup';

const MAX_FILE = 25 * 1024 * 1024;
const dedupe = list => [...new Map(list.map(s => [s.id, s])).values()];

function DataSection() {
  const { settings, set, replaceAll: replaceSettings } = useSettings();
  const { solves, replaceAll } = useSolves();
  const toast = useToast();
  const input = useRef(null);
  const [incoming, setIncoming] = useState(null);

  function backup() {
    const { lastBackup, ...rest } = settings; // eslint-disable-line no-unused-vars
    downloadFile(backupFilename(), JSON.stringify(buildBackup(solves, rest), null, 2), 'application/json');
    set('lastBackup', new Date().toISOString());
    toast.show('info', 'Backup downloaded', `${solves.length} ${solves.length === 1 ? 'solve' : 'solves'} saved to a file. Keep it somewhere safe.`);
  }
  function exportCsv() {
    downloadFile(csvFilename(), solvesToCsv(solves), 'text/csv;charset=utf-8');
    toast.show('info', 'CSV exported', 'Opens in Excel, Google Sheets and Numbers.');
  }
  async function pick(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_FILE) throw new Error('That file is too large to be a Cubiko backup.');
      setIncoming(parseBackup(await file.text()));
    } catch (err) { toast.show('error', 'Couldn’t read that file', err.message, 6000); }
  }
  function applySettings(withSettings) { if (withSettings && incoming.settings) replaceSettings(incoming.settings); }
  function merge(withSettings) {
    const { merged, added } = mergeSolves(solves, dedupe(incoming.solves));
    replaceAll(merged); applySettings(withSettings); setIncoming(null);
    toast.show('info', 'Backup merged', `${added} new ${added === 1 ? 'solve' : 'solves'} added. You now have ${merged.length}.`);
  }
  function replace(withSettings) {
    const next = dedupe(incoming.solves).sort(byDate);
    replaceAll(next); applySettings(withSettings); setIncoming(null);
    toast.show('info', 'Backup restored', `${next.length} ${next.length === 1 ? 'solve' : 'solves'} loaded.`);
  }

  const last = settings.lastBackup ? new Date(settings.lastBackup).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'never';
  return (
    <>
      <h2>Data &amp; backup</h2>
      <SettingRow title="Download backup" hint={`Saves all ${solves.length} solves, notes and settings to a JSON file. Last backup: ${last}.`}>
        <button className="btn pri" type="button" onClick={backup}>Download backup</button>
      </SettingRow>
      <SettingRow title="Restore from backup" hint="Load a Cubiko backup file. You choose whether to merge or replace.">
        <button className="btn" type="button" onClick={() => input.current?.click()}>Restore…</button>
        <input ref={input} type="file" accept=".json,application/json" hidden onChange={pick} />
      </SettingRow>
      <SettingRow title="Export CSV" hint="One row per solve for spreadsheets: date, time, penalty, scramble and note.">
        <button className="btn" type="button" disabled={!solves.length} onClick={exportCsv}>Export CSV</button>
      </SettingRow>
      <p className="status data-note">Your solves live in this browser only. Clearing site data deletes them, so download a backup now and then.</p>
      {incoming && (
        <ImportDialog file={incoming} currentCount={solves.length} newCount={mergeSolves(solves, dedupe(incoming.solves)).added}
          onMerge={merge} onReplace={replace} onCancel={() => setIncoming(null)} />
      )}
    </>
  );
}

export default function SettingsPage() {
  const { settings: s, set, resetLook } = useSettings();
  const customAccent = !ACCENTS[s.accent];
  return (
    <section className="page on" id="prefs">
      <h1>Settings</h1>
      <p className="sub">Your preferences are saved in this browser.</p>

      <h2>Appearance</h2>
      <SettingRow title="Theme" hint="Switch between dark and light.">
        <Seg label="Theme" value={s.theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={v => set('theme', v)} />
      </SettingRow>
      <SettingRow title="Color scheme" hint="Background style. Applies to the dark theme.">
        <div className="chips" role="group" aria-label="Color scheme">
          {PALETTES.map(([id, label, color]) => (
            <button key={id} type="button" className={s.palette === id ? 'on' : ''} aria-pressed={s.palette === id} onClick={() => set('palette', id)}><i style={{ background: color }} />{label}</button>
          ))}
        </div>
      </SettingRow>
      <SettingRow title="Accent color" hint="Choose a preset or pick your own.">
        <div className="accents">
          {Object.entries(ACCENTS).map(([id, [color]]) => (
            <button key={id} type="button" className={s.accent === id ? 'on' : ''} style={{ '--c': color }} aria-label={id[0].toUpperCase() + id.slice(1)} aria-pressed={s.accent === id} onClick={() => set('accent', id)} />
          ))}
          <label className={`custom ${customAccent ? 'on' : ''}`} title="Custom color">
            <input type="color" aria-label="Custom accent color" value={customAccent && /^#[0-9a-f]{6}$/i.test(s.accent) ? s.accent : ACCENTS.cyan[0].toLowerCase()} onChange={e => set('accent', e.target.value)} />
          </label>
        </div>
      </SettingRow>
      <SettingRow title="Corners" hint="How rounded buttons and panels look.">
        <Seg label="Corners" value={s.corners} options={[['sharp', 'Sharp'], ['soft', 'Soft'], ['round', 'Round']]} onChange={v => set('corners', v)} />
      </SettingRow>
      <SettingRow title="Timer font" hint="Typeface for the timer digits.">
        <Seg label="Timer font" value={s.tfont} options={[['sans', 'Sans'], ['mono', 'Mono']]} onChange={v => set('tfont', v)} />
      </SettingRow>
      <SettingRow title="Timer size" hint="Size of the main timer digits.">
        <Seg label="Timer size" value={s.size} options={[['Small', 'Small'], ['Medium', 'Medium'], ['Large', 'Large']]} onChange={v => set('size', v)} />
      </SettingRow>
      <SettingRow title="Scramble preview" hint="Show the cube diagram next to each scramble.">
        <Switch label="Scramble preview" checked={s.preview} onChange={v => set('preview', v)} />
      </SettingRow>
      <SettingRow title="Time precision" hint="Decimals shown while solving.">
        <Seg label="Time precision" value={s.precision} options={[[1, '0.1'], [2, '0.01'], [3, '0.001']]} onChange={v => set('precision', v)} />
      </SettingRow>
      <SettingRow title="Hide timer while solving" hint="Show dots while the timer runs and reveal your time when you stop.">
        <Switch label="Hide timer while solving" checked={s.hideTimer} onChange={v => set('hideTimer', v)} />
      </SettingRow>
      <SettingRow title="Reset appearance" hint="Back to the default look.">
        <button className="btn" type="button" onClick={resetLook}>Reset</button>
      </SettingRow>

      <h2>Timer</h2>
      <SettingRow title="Inspection time" hint="15 seconds before each solve. Hold Space, release to start inspection, then do it again to start the solve.">
        <Switch label="Inspection time" checked={s.inspection} onChange={v => set('inspection', v)} />
      </SettingRow>
      <SettingRow title="Sound" hint="Beep and a voice say “8 seconds” and “12 seconds” during inspection. Also plays a short fanfare on records and wins.">
        <div className="ctl">
          <button className="btn" type="button" onClick={() => { unlockAudio(); announceInspection(8, true); }}>Test</button>
          <Switch label="Sound" checked={s.sound} onChange={v => set('sound', v)} />
        </div>
      </SettingRow>

      <h2>Race</h2>
      <SettingRow title="Race mode" hint="Take turns: you solve, then the bot solves. Solve together: both timers start at the same moment.">
        <Chips label="Race mode" value={s.raceMode} options={[['alternate', 'Take turns'], ['together', 'Solve together']]} onChange={v => set('raceMode', v)} />
      </SettingRow>
      <SettingRow title="Hide bot time" hint="The bot’s clock shows dots while it solves. Its time appears when the round is decided.">
        <Switch label="Hide bot time" checked={s.hideBotTime} onChange={v => set('hideBotTime', v)} />
      </SettingRow>

      <DataSection />

      <h2>Keyboard controls</h2>
      <div className="keys"><kbd>Space</kbd><span>Hold until the timer turns green, release to start. Press to stop.</span><kbd>Esc</kbd><span>Cancel inspection, or close a panel.</span><kbd>← →</kbd><span>Move between solves in the solve details panel.</span><kbd>Tap</kbd><span>On touch screens, tap the timer area.</span></div>
    </section>
  );
}
