import { createContext, useContext, useRef, useState } from 'react';
import { makeScramble } from '../lib/scramble';
import { format } from '../lib/stats';
import { useSettings } from './useSettings';
import { useSolveTimer } from './useSolveTimer';

const Ctx = createContext(null);
export const useRace = () => useContext(Ctx);

const INITIAL = {
  active: false, matchOver: false, round: 0, playerPoints: 0, botPoints: 0, log: [],
  bestOf: 3, target: 2, level: 20, scramble: '',
  penalty: false,
  awaiting: false,            // you finished, the round is not decided yet (bot still solving)
  popup: null,                // round / match result shown in the pop-up
  botDisplay: '0.00', botPhase: 'idle' // idle | solving | done
};

/**
 * Race state lives above the pages so a match survives switching tabs.
 * Two modes (Settings > Race):
 *   alternate: you solve first, then the bot solves on its own live timer (original behaviour)
 *   together : the bot's timer starts the moment yours does
 * "Hide bot time" shows dots on the bot's clock and reveals its time when the round is decided.
 */
export function RaceProvider({ children }) {
  const { settings } = useSettings();
  const s = useRef(settings); s.current = settings;
  const [match, setMatch] = useState(INITIAL);
  const m = useRef(INITIAL);
  const commit = patch => { m.current = { ...m.current, ...patch }; setMatch(m.current); };
  const bot = useRef({ raf: 0, start: 0, target: 0, done: false });
  const round = useRef({ mode: 'alternate', hide: false, playerTime: null, penalty: false });

  function stopBot() { cancelAnimationFrame(bot.current.raf); bot.current.done = false; }

  function finishRound() {
    const cur = m.current, playerTime = round.current.playerTime, botTime = bot.current.target;
    const winner = playerTime < botTime ? 'player' : playerTime > botTime ? 'bot' : 'tie';
    const playerPoints = cur.playerPoints + (winner === 'player' ? 1 : 0);
    const botPoints = cur.botPoints + (winner === 'bot' ? 1 : 0);
    const matchOver = playerPoints >= cur.target || botPoints >= cur.target;
    const penalty = round.current.penalty;
    round.current.playerTime = null;
    commit({
      round: cur.round + 1, playerPoints, botPoints, awaiting: false, matchOver, active: !matchOver,
      botPhase: 'done', botDisplay: format(botTime),
      log: [...cur.log, { player: playerTime, bot: botTime, winner, scramble: cur.scramble, penalty }],
      scramble: matchOver ? cur.scramble : makeScramble(20),
      popup: { winner, playerTime, botTime, penalty, round: cur.round + 1, playerPoints, botPoints, match: matchOver, bestOf: cur.bestOf }
    });
  }

  function startBot() {
    const b = bot.current, level = m.current.level, floor = level * 0.78, ceiling = level * 0.995;
    cancelAnimationFrame(b.raf);
    b.target = Number((floor + Math.random() * (ceiling - floor)).toFixed(2)); // close to, but generally under, its level
    b.start = performance.now(); b.done = false;
    const hide = round.current.hide = s.current.hideBotTime;
    commit({ botPhase: 'solving', botDisplay: hide ? '•••' : '0.00' });
    const tick = () => {
      const elapsed = (performance.now() - b.start) / 1000;
      if (elapsed >= b.target) {
        b.done = true;
        const playerDone = round.current.playerTime != null;
        // with hidden times and you still solving, the bot's time stays hidden until the round is decided
        commit({ botPhase: 'done', botDisplay: hide && !playerDone ? '•••' : format(b.target) });
        if (playerDone) finishRound();
        return;
      }
      if (!hide) commit({ botDisplay: format(elapsed) });
      b.raf = requestAnimationFrame(tick);
    };
    b.raf = requestAnimationFrame(tick);
  }

  const timer = useSolveTimer({
    inspection: true, hideTimer: settings.hideTimer, decimals: settings.precision, sound: settings.sound,
    onStart: () => { if (round.current.mode === 'together') startBot(); },
    onStop: ({ seconds, penalty }) => {
      round.current.playerTime = Number((seconds + (penalty ? 2 : 0)).toFixed(2));
      round.current.penalty = penalty;
      commit({ awaiting: true, penalty });
      if (round.current.mode === 'alternate') startBot();
      else if (bot.current.done) finishRound();
    }
  });

  const phaseIdle = () => ['idle', 'stopped'].includes(timer.getPhase());
  const canStartNow = () => { const c = m.current; return c.active && !c.matchOver && !c.awaiting && !c.popup && phaseIdle(); };

  function beginRound() {
    if (!canStartNow()) return;
    round.current = { mode: s.current.raceMode, hide: s.current.hideBotTime, playerTime: null, penalty: false };
    stopBot();
    commit({ botDisplay: '0.00', botPhase: 'idle' });
    timer.beginInspection();
  }
  function startMatch() {
    stopBot(); timer.cancel();
    const bestOf = s.current.raceBestOf;
    round.current = { mode: s.current.raceMode, hide: false, playerTime: null, penalty: false };
    commit({ ...INITIAL, active: true, bestOf, target: Math.ceil(bestOf / 2), level: s.current.raceLevel, scramble: makeScramble(20) });
  }
  function resetMatch() { stopBot(); timer.cancel(); round.current.playerTime = null; commit({ ...INITIAL }); }
  function closePopup() { if (m.current.popup) commit({ popup: null }); }
  function cancelAttempt() {
    if (!timer.isBusy()) return;
    const wasRunning = timer.getPhase() === 'running';
    timer.cancel();
    if (wasRunning && !m.current.awaiting) { stopBot(); commit({ botPhase: 'idle', botDisplay: '0.00' }); }
  }
  function press() {
    const c = m.current;
    if (c.popup) { closePopup(); return; }
    if (!c.active || c.matchOver || c.awaiting) return;
    if (phaseIdle()) beginRound(); else timer.press();
  }
  function release() {
    const c = m.current;
    if (c.popup || !c.active || c.matchOver || c.awaiting) return;
    timer.release();
  }

  const value = {
    match, phase: timer.phase, display: timer.display,
    canStart: match.active && !match.matchOver && !match.awaiting && !match.popup && (timer.phase === 'idle' || timer.phase === 'stopped'),
    startMatch, resetMatch, beginRound, press, release, abort: timer.abort, cancelAttempt, closePopup
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
