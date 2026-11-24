import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Seg } from '../components/Controls';
import CubeNet from '../components/CubeNet';
import ConfirmDialog from '../components/ConfirmDialog';
import SolveDetail from '../components/SolveDetail';
import StatsStrip from '../components/StatsStrip';
import { useSettings } from '../hooks/useSettings';
import { useSolves } from '../hooks/useSolves';
import { useSolveTimer } from '../hooks/useSolveTimer';
import { useToast } from '../hooks/useToast';
import { SIZES } from '../lib/settingsConfig';
import { makeScramble } from '../lib/scramble';
import { average, best, checkRecords, format, formatSolve, mean, valueOf } from '../lib/stats';
import { confetti } from '../lib/confetti';
import { playFanfare } from '../lib/audio';

export function statEntries(solves) {
  return [['Best', format(best(solves)), true], ['Mean', format(mean(solves))], ['Ao5', format(average(solves, 5))], ['Ao12', format(average(solves, 12))], ['Ao100', format(average(solves, 100))], ['Solves', solves.length]];
}
const PenaltyTag = ({ p }) => p === '+2' ? <span className="tag p2">+2</span> : p === 'dnf' ? <span className="tag dnf">DNF</span> : <span className="none">–</span>;
const isTyping = t => /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName) || t?.isContentEditable;

export default function TimerPage() {
  const { settings } = useSettings();
  const { solves, add, setPenalty, setNote, remove } = useSolves();
  const toast = useToast();
  const [scramble, setScramble] = useState(() => makeScramble());
  const [shownId, setShownId] = useState(() => solves.at(-1)?.id ?? null);
  const [flash, setFlash] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const timer = useSolveTimer({
    inspection: settings.inspection, hideTimer: settings.hideTimer, decimals: settings.precision, sound: settings.sound,
    onStop: ({ seconds, penalty }) => {
      const solve = add({ t: seconds, p: penalty ? '+2' : '', s: scramble });
      const record = checkRecords(solves, solve); // `solves` is the list before this one was added
      setShownId(solve.id); setScramble(makeScramble());
      if (!record) return;
      if (record.type === 'pb') {
        setFlash('pb');
        toast.show('pb', 'New personal best!', `${formatSolve(solve)} · ${record.diff.toFixed(2)}s faster than your previous best`);
        confetti(150); playFanfare(settings.sound);
      } else {
        toast.show('slow', 'Slowest solve so far', `${formatSolve(solve)} · ${record.diff.toFixed(2)}s slower than before. Shake it off, the next one is yours.`);
      }
    }
  });

  const shown = solves.find(s => s.id === shownId) || null;
  const busy = ['inspection', 'armed', 'running'].includes(timer.phase);
  const clockText = busy ? timer.display : shown ? formatSolve(shown) : '0.00';
  const clockClass = { running: 'run', holding: 'ready', armed: 'ready', inspection: 'insp' }[timer.phase] || flash;
  const modalOpen = detailId !== null || pendingDelete !== null;

  // Full-screen tap target while inspecting / solving: tap anywhere to stop. It lingers briefly (invisible)
  // after a stop so the tap that stopped the timer can't land on a button underneath.
  const overlayOn = ['inspection', 'armed', 'running'].includes(timer.phase);
  const [overlayLingers, setOverlayLingers] = useState(false);
  useEffect(() => {
    if (overlayOn) { setOverlayLingers(true); return undefined; }
    const t = setTimeout(() => setOverlayLingers(false), 300);
    return () => clearTimeout(t);
  }, [overlayOn]);

  // Phone layout: Timer and History are two swipeable panes
  const panesRef = useRef(null);
  const [pane, setPane] = useState(0);
  const onPanesScroll = e => { const el = e.currentTarget, i = Math.round(el.scrollLeft / (el.clientWidth || 1)); setPane(p => (p === i ? p : i)); };
  const goPane = i => { setPane(i); const el = panesRef.current; el?.scrollTo?.({ left: i * el.clientWidth, behavior: 'smooth' }); };

  const detailIndex = detailId ? solves.findIndex(s => s.id === detailId) : -1;
  useEffect(() => { if (detailId && detailIndex < 0) setDetailId(null); }, [detailId, detailIndex]);

  // keyboard: Space drives the timer (ignored while typing a note or while a dialog is open)
  useEffect(() => {
    const down = e => {
      if (e.key === 'Escape') { if (pendingDelete) setPendingDelete(null); else if (detailId) setDetailId(null); return; }
      if (e.code !== 'Space' || modalOpen || isTyping(e.target)) return;
      e.preventDefault(); if (!e.repeat) { setFlash(''); timer.press(); }
    };
    const up = e => { if (e.code !== 'Space' || modalOpen || isTyping(e.target)) return; e.preventDefault(); timer.release(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [modalOpen, pendingDelete, detailId, timer.press, timer.release]);

  const askDelete = id => { if (timer.phase !== 'running') setPendingDelete(id); };
  const confirmDelete = () => { const id = pendingDelete; setPendingDelete(null); if (!id) return; remove(id); if (id === shownId) setShownId(null); };
  const pendingSolve = solves.find(s => s.id === pendingDelete);

  const latestActionsOff = !shown || timer.phase === 'running';
  const act = kind => {
    if (!shown || latestActionsOff) return;
    if (kind === 'plus2') setPenalty(shown.id, shown.p === '+2' ? '' : '+2');
    if (kind === 'dnf') setPenalty(shown.id, shown.p === 'dnf' ? '' : 'dnf');
    if (kind === 'delete') askDelete(shown.id);
  };

  const bestValue = useMemo(() => best(solves), [solves]);
  const bestIndex = bestValue !== null && Number.isFinite(bestValue) ? solves.findIndex(s => valueOf(s) === bestValue) : -1;
  const rows = useMemo(() => solves.slice(-50).reverse().map((solve, i) => ({ solve, number: solves.length - i })), [solves]);

  return (
    <section className="page on timer-page" id="timer">
      <div className="pane-tabs">
        <Seg label="Section" value={pane} options={[[0, 'Timer'], [1, `History (${solves.length})`]]} onChange={goPane} />
      </div>
      <div className="timer-panes" ref={panesRef} onScroll={onPanesScroll}>
      <div className="pane pane-timer">
      <div className="scramble">
        <div className="scr-text">
          <p id="scr">{scramble}</p>
          <button className="btn" type="button" onClick={() => setScramble(makeScramble())}>
            <svg className="i" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>New scramble
          </button>
        </div>
        <CubeNet scramble={scramble} />
      </div>

      <div className="stage" id="stage" tabIndex={0} aria-label="Timer. Press space to start and stop."
        onPointerDown={e => { e.preventDefault(); setFlash(''); timer.press(); }} onPointerUp={timer.release} onPointerCancel={timer.abort}>
        <div id="clock" className={clockClass} style={{ fontSize: SIZES[settings.size] || undefined }}>{clockText}</div>
      </div>

      <div className="current-actions" aria-label="Latest solve actions">
        <button type="button" disabled={latestActionsOff} onClick={() => act('plus2')}>+2</button>
        <button type="button" disabled={latestActionsOff} onClick={() => act('dnf')}>DNF</button>
        <button type="button" className="danger" aria-label="Delete latest solve" title="Delete latest solve" disabled={latestActionsOff} onClick={() => act('delete')}>×</button>
      </div>

      <StatsStrip entries={statEntries(solves)} />

      </div>
      <div className="pane pane-history">
      <h2>Solve history <span className="h2-hint">Tap a solve for details</span></h2>
      <div className="tw tall">
        <table>
          <thead><tr><th>#</th><th>Time</th><th>Penalty</th><th>Scramble</th><th aria-label="Delete" /></tr></thead>
          <tbody>
            {rows.length ? rows.map(({ solve, number }) => (
              <tr key={solve.id} className={`clickable ${solve.p === 'dnf' ? 'isdnf' : ''}`} tabIndex={0}
                aria-label={`Solve ${number}, ${formatSolve(solve)}. Open details`}
                onClick={() => setDetailId(solve.id)}
                onKeyDown={e => { if (e.key === 'Enter') setDetailId(solve.id); }}>
                <td>{number}</td>
                <td>{formatSolve(solve)}{number - 1 === bestIndex && <> <span className="tag pb">PB</span></>}{solve.note && <span className="note-dot" title="Has a note" aria-label="Has a note" />}</td>
                <td><PenaltyTag p={solve.p} /></td>
                <td className="scr">{solve.s}</td>
                <td className="del-cell">
                  <button type="button" className="row-del" aria-label={`Delete solve ${number}`} title="Delete this solve"
                    onClick={e => { e.stopPropagation(); askDelete(solve.id); }}>×</button>
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="empty">No solves yet. Start the timer to record your first solve.</td></tr>}
          </tbody>
        </table>
      </div>
      </div>
      </div>

      {(overlayOn || overlayLingers) && createPortal(
        <div className={`run-overlay ${overlayOn ? '' : 'ghost'}`} role="button" aria-label="Tap anywhere to stop the timer"
          onPointerDown={e => { e.preventDefault(); if (!overlayOn) return; setFlash(''); timer.press(); }}
          onPointerUp={timer.release} onPointerCancel={timer.abort}>
          <div className={`run-clock ${clockClass}`} style={{ fontSize: SIZES[settings.size] || undefined }}>{timer.display}</div>
          <p className="run-hint">{timer.phase === 'inspection' ? 'Touch and hold, release to start' : timer.phase === 'armed' ? 'Release to start' : ''}</p>
        </div>, document.body)}

      {detailIndex >= 0 && (
        <SolveDetail solves={solves} index={detailIndex}
          onClose={() => setDetailId(null)}
          onNavigate={d => { const next = solves[detailIndex + d]; if (next) setDetailId(next.id); }}
          onPenalty={setPenalty} onNote={setNote} onDelete={askDelete} />
      )}
      {pendingSolve && (
        <ConfirmDialog title="Delete this solve?" sub={`${formatSolve(pendingSolve)} · solve #${solves.indexOf(pendingSolve) + 1}`}
          onYes={confirmDelete} onNo={() => setPendingDelete(null)} />
      )}
    </section>
  );
}
