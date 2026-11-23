import { useEffect, useMemo, useRef, useState } from 'react';
import CubeNet from './CubeNet';
import { MAX_NOTE } from '../lib/backup';
import { average, averageAt, best, format, formatSolve, valueOf } from '../lib/stats';

const Cell = ({ label, children }) => <div className="sd-cell"><small>{label}</small><b>{children}</b></div>;

/** Panel opened from a history row: preview, date, time, Ao5/Ao12 at that moment, copy scramble, note. */
export default function SolveDetail({ solves, index, onClose, onNavigate, onPenalty, onNote, onDelete }) {
  const solve = solves[index];
  const [draft, setDraft] = useState(solve.note || '');
  const [copied, setCopied] = useState(false);
  const draftRef = useRef(draft); draftRef.current = draft;
  const savedRef = useRef(solve.note || '');
  const closeRef = useRef(null);

  // Switching to another solve (prev/next) loads its note.
  useEffect(() => { setDraft(solve.note || ''); savedRef.current = solve.note || ''; setCopied(false); }, [solve.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { closeRef.current?.focus(); }, []);

  const flush = () => { if (draftRef.current !== savedRef.current) { onNote(solve.id, draftRef.current); savedRef.current = draftRef.current; } };
  const flushRef = useRef(flush); flushRef.current = flush;
  useEffect(() => () => flushRef.current(), []); // save a pending note if the panel unmounts

  const close = () => { flush(); onClose(); };
  const go = delta => { flush(); onNavigate(delta); };

  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stats = useMemo(() => {
    const bestSoFar = best(solves.slice(0, index + 1));
    return { ao5: averageAt(solves, index, 5), ao12: averageAt(solves, index, 12), isPb: Number.isFinite(valueOf(solve)) && valueOf(solve) === bestSoFar && index > 0 };
  }, [solves, index, solve]);

  async function copyScramble() {
    try { await navigator.clipboard.writeText(solve.s); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: solve.s });
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* ignore */ } ta.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  const date = new Date(solve.date);
  const dateText = Number.isNaN(date.getTime()) || date.getTime() === 0 ? 'Unknown' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="popup-back sheet-back" onPointerDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sd-title">
        <div className="sd-head">
          <button type="button" className="icon-btn" aria-label="Previous solve" disabled={index === 0} onClick={() => go(-1)}>‹</button>
          <p id="sd-title">Solve #{index + 1}<small>of {solves.length}</small></p>
          <button type="button" className="icon-btn" aria-label="Next solve" disabled={index === solves.length - 1} onClick={() => go(1)}>›</button>
          <button type="button" className="icon-btn close" ref={closeRef} aria-label="Close" onClick={close}>×</button>
        </div>

        <div className="sd-time">
          <b className={solve.p === 'dnf' ? 'bad' : ''}>{formatSolve(solve)}</b>
          {solve.p === '+2' && <span className="tag p2">+2</span>}
          {solve.p === 'dnf' && <span className="tag dnf">DNF</span>}
          {stats.isPb && <span className="tag pb">PB at the time</span>}
        </div>

        <CubeNet scramble={solve.s} keep className="big" />

        <div className="sd-grid">
          <Cell label="Date">{dateText}</Cell>
          <Cell label="Recorded time">{format(solve.t)}{solve.p === '+2' ? ' + 2' : ''}</Cell>
          <Cell label="Ao5 at that solve">{format(stats.ao5)}</Cell>
          <Cell label="Ao12 at that solve">{format(stats.ao12)}</Cell>
        </div>

        <div className="sd-scr">
          <p className="mono">{solve.s}</p>
          <button type="button" className="btn" onClick={copyScramble}>{copied ? 'Copied ✓' : 'Copy scramble'}</button>
        </div>

        <label className="sd-note">Note
          <textarea value={draft} maxLength={MAX_NOTE} rows={3} placeholder="Cross color, lock-up on the last pair, new OLL…" onChange={e => setDraft(e.target.value)} onBlur={flush} />
        </label>

        <div className="sd-actions">
          <button type="button" className={`btn ${solve.p === '+2' ? 'pri' : ''}`} onClick={() => onPenalty(solve.id, solve.p === '+2' ? '' : '+2')}>+2</button>
          <button type="button" className={`btn ${solve.p === 'dnf' ? 'pri' : ''}`} onClick={() => onPenalty(solve.id, solve.p === 'dnf' ? '' : 'dnf')}>DNF</button>
          <button type="button" className="btn danger" onClick={() => { flush(); onDelete(solve.id); }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
