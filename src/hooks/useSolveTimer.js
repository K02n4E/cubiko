import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from '../lib/stats';
import { announceInspection, unlockAudio } from '../lib/audio';

/**
 * Shared stopwatch + WCA inspection state machine, used by the Timer and by Race.
 * phases: idle -> holding -> (inspection -> armed ->) running -> stopped
 *   holding   = Space/pointer is down before a solve (or before inspection starts)
 *   armed     = pressed again during inspection; release starts the solve
 * options (read fresh on every call): inspection, hideTimer, decimals, sound, onStart(), onStop({seconds, penalty})
 */
export function useSolveTimer(options) {
  const opts = useRef(options); opts.current = options;
  const [phase, setPhaseState] = useState('idle');
  const [display, setDisplay] = useState('0.00');
  const ph = useRef('idle');
  const r = useRef({ start: 0, raf: 0, interval: 0, left: 15, penalty: false, prev: 'idle' });

  const api = useMemo(() => {
    const setPhase = p => { ph.current = p; setPhaseState(p); };
    const clearAll = () => { cancelAnimationFrame(r.current.raf); clearInterval(r.current.interval); };

    const startSolve = () => {
      setPhase('running'); r.current.start = performance.now();
      opts.current.onStart?.();
      const tick = () => {
        const { hideTimer, decimals = 2 } = opts.current;
        setDisplay(hideTimer ? '•••' : format((performance.now() - r.current.start) / 1000, decimals));
        r.current.raf = requestAnimationFrame(tick);
      };
      tick();
    };
    const stop = () => {
      cancelAnimationFrame(r.current.raf);
      const seconds = Number(((performance.now() - r.current.start) / 1000).toFixed(2));
      const penalty = r.current.penalty; r.current.penalty = false;
      setPhase('stopped'); setDisplay(format(seconds + (penalty ? 2 : 0)));
      opts.current.onStop?.({ seconds, penalty });
    };
    const beginInspection = () => {
      unlockAudio(); clearAll();
      r.current.left = 15; r.current.penalty = false;
      setPhase('inspection'); setDisplay('15');
      r.current.interval = setInterval(() => {
        const s = r.current; s.left--;
        if (s.left === 7) announceInspection(8, opts.current.sound);
        if (s.left === 3) announceInspection(12, opts.current.sound);
        if (s.left <= 0) s.penalty = true;
        if (ph.current === 'inspection' || ph.current === 'armed') setDisplay(s.left > 0 ? String(s.left) : '+2');
        if (s.left <= -2) clearInterval(s.interval);
      }, 1000);
    };
    return {
      press() {
        const p = ph.current;
        if (p === 'running') stop();
        else if (p === 'idle' || p === 'stopped') { r.current.prev = p; setPhase('holding'); }
        else if (p === 'inspection') setPhase('armed');
      },
      release() {
        const p = ph.current;
        if (p === 'holding') { if (opts.current.inspection) beginInspection(); else startSolve(); }
        else if (p === 'armed') { clearInterval(r.current.interval); startSolve(); }
      },
      /** The browser took over the touch (e.g. a swipe): undo a press without starting anything. */
      abort() {
        const p = ph.current;
        if (p === 'holding') setPhase(r.current.prev || 'idle');
        else if (p === 'armed') setPhase('inspection');
      },
      beginInspection,
      /** Abort whatever is happening and go back to idle. */
      cancel() { clearAll(); r.current.penalty = false; setPhase('idle'); setDisplay('0.00'); },
      isBusy: () => ['holding', 'inspection', 'armed', 'running'].includes(ph.current),
      getPhase: () => ph.current
    };
  }, []);

  useEffect(() => () => { cancelAnimationFrame(r.current.raf); clearInterval(r.current.interval); }, []);
  return { phase, display, ...api };
}
