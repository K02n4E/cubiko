import { useEffect, useRef } from 'react';
import CubeNet from '../components/CubeNet';
import { Chips, Switch } from '../components/Controls';
import { useRace } from '../hooks/useRace';
import { useSettings } from '../hooks/useSettings';
import { format } from '../lib/stats';
import { confetti } from '../lib/confetti';
import { playFanfare } from '../lib/audio';

const ICONS = {
  win: <path d="m5 12 5 5L20 7" />,
  lose: <path d="M6 6l12 12M18 6 6 18" />,
  tie: <path d="M5 9h14M5 15h14" />,
  trophy: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
};
const BEST_OF = [1, 3, 5, 7, 9].map(n => [n, `Best of ${n}`]);
const LEVELS = [20, 15, 12, 10, 7, 5].map(n => [n, `Sub-${n}`]);
const MODES = [['alternate', 'Take turns'], ['together', 'Solve together']];
const pips = (filled, total) => Array.from({ length: total }, (_, i) => <i key={i} className={i < filled ? 'on' : ''} />);
const isTyping = t => /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName) || t?.isContentEditable;
const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches;

function RacePopup({ info, onMain, onClose }) {
  const you = info.winner === 'player', tie = info.winner === 'tie';
  const diff = Math.abs(info.botTime - info.playerTime).toFixed(2);
  const standing = `You ${info.playerPoints} – ${info.botPoints} Bot`;
  let kind = tie ? 'tie' : you ? 'win' : 'lose', icon = ICONS[kind], title, sub, score;
  if (info.match) {
    const won = info.playerPoints > info.botPoints;
    kind = won ? 'win' : 'lose'; icon = ICONS.trophy;
    title = won ? 'You won the match' : 'Bot won the match';
    sub = `Best of ${info.bestOf} · ${you ? 'you were' : 'bot was'} ${diff}s faster in the last round`;
    score = `Final score · ${standing}`;
  } else {
    title = tie ? 'Tie round' : you ? 'You won the round' : 'Bot won the round';
    sub = tie ? 'Identical times, no point awarded' : `${you ? 'You were' : 'Bot was'} ${diff}s faster`;
    score = `Round ${info.round} · ${standing}`;
  }
  const main = useRef(null);
  useEffect(() => { main.current?.focus(); }, []);
  return (
    <div className="popup-back" onPointerDown={e => { if (e.target === e.currentTarget && !info.match) onClose(); }}>
      <div className={`popup ${kind}`} role="dialog" aria-modal="true" aria-labelledby="pp-title">
        <div className="pp-icon"><svg className="i" viewBox="0 0 24 24">{icon}</svg></div>
        <p className="pp-title" id="pp-title">{title}</p>
        <p className="pp-sub">{sub}</p>
        <div className="pp-times">
          <div className={you ? 'w' : ''}><small>You</small><b>{format(info.playerTime)}{info.penalty ? ' (+2)' : ''}</b></div>
          <div className={info.winner === 'bot' ? 'w' : ''}><small>Bot</small><b>{format(info.botTime)}</b></div>
        </div>
        <p className="pp-score">{score}</p>
        <div className="pp-actions">
          <button className="btn pri" type="button" ref={main} onClick={onMain}>{info.match ? 'Race again' : 'Next round'}</button>
          {info.match && <button className="btn" type="button" onClick={onClose}>Close</button>}
        </div>
      </div>
    </div>
  );
}

export default function RacePage() {
  const { settings, set } = useSettings();
  const race = useRace();
  const { match, phase, display } = race;
  const live = useRef(race); live.current = race;

  // leaving the page cancels an unfinished attempt of yours (a bot that is already solving carries on)
  useEffect(() => () => live.current.cancelAttempt(), []);

  useEffect(() => {
    const down = e => {
      if (e.key === 'Escape') { if (live.current.match.popup) live.current.closePopup(); else live.current.cancelAttempt(); return; }
      if (e.code !== 'Space' || isTyping(e.target)) return;
      e.preventDefault(); if (!e.repeat) live.current.press();
    };
    const up = e => { if (e.code !== 'Space' || isTyping(e.target)) return; e.preventDefault(); live.current.release(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // celebrate when a result pop-up appears
  useEffect(() => {
    const info = match.popup;
    if (info && info.winner === 'player') { confetti(info.match ? 220 : 70); if (info.match) playFanfare(settings.sound); }
  }, [match.popup]); // eslint-disable-line react-hooks/exhaustive-deps

  const showBoard = match.active || match.matchOver;
  const touch = isTouch();
  const need = Math.ceil(settings.raceBestOf / 2);
  const playerClass = { inspection: 'insp', armed: 'ready', running: 'run', stopped: 'done' }[phase] || '';
  const botClass = { idle: 'idle', solving: 'run', done: 'done' }[match.botPhase];
  const playerActive = ['inspection', 'armed', 'running'].includes(phase);

  let instruction;
  if (match.matchOver) instruction = 'Match finished';
  else if (match.awaiting) instruction = match.penalty ? 'Solve complete · +2 penalty' : 'Solve complete';
  else if (phase === 'inspection') instruction = touch ? 'Inspection · touch and release to start' : 'Inspection · hold Space, release to start';
  else if (phase === 'armed') instruction = 'Release to start';
  else if (phase === 'running') instruction = touch ? 'Solving · tap to stop' : 'Solving · press to stop';
  else instruction = touch ? 'Tap Ready to start inspection' : 'Press Ready or Space to start inspection';

  let botInstruction;
  if (match.botPhase === 'solving') botInstruction = settings.hideBotTime ? 'Solving · time hidden' : 'Solving…';
  else if (match.botPhase === 'done') botInstruction = match.botDisplay === '•••' ? 'Finished · time shows when you stop' : 'Solve complete';
  else botInstruction = settings.raceMode === 'together' ? 'Starts when you start' : 'Waiting for you';

  const readyLabel = match.matchOver ? 'Race again' : match.awaiting ? 'Bot solving…' : phase === 'inspection' || phase === 'armed' ? 'Inspecting…' : phase === 'running' ? 'Solving…' : 'Ready';
  const point = w => w === 'player' ? <span className="pt you">You</span> : w === 'bot' ? <span className="pt">Bot</span> : <span className="none">Tie</span>;

  return (
    <section className="page on" id="race">
      <div className="race-head">
        <div><h1>Race</h1><p className="sub">Race a bot on the same scramble. Pick how long the match is and how fast the bot is.</p></div>
        <button className="btn" type="button" onClick={race.resetMatch}>Reset match</button>
      </div>

      {!showBoard && (
        <div className="race-setup">
          <div className="rs-group"><p className="rs-label">Match length</p>
            <Chips label="Match length" value={settings.raceBestOf} options={BEST_OF} onChange={v => set('raceBestOf', v)} />
            <p className="status">{settings.raceBestOf === 1 ? 'One round decides the match.' : `First to ${need} round wins takes the match.`}</p>
          </div>
          <div className="rs-group"><p className="rs-label">Bot level</p>
            <Chips label="Bot difficulty" value={settings.raceLevel} options={LEVELS} onChange={v => set('raceLevel', v)} />
          </div>
          <div className="rs-group"><p className="rs-label">Race mode</p>
            <Chips label="Race mode" value={settings.raceMode} options={MODES} onChange={v => set('raceMode', v)} />
            <p className="status">{settings.raceMode === 'together' ? 'The bot’s timer starts the moment yours does.' : 'You solve first, then the bot solves on its own timer.'}</p>
          </div>
          <div className="rs-group rs-switch"><p className="rs-label">Hide bot time</p>
            <div className="rs-switch-row">
              <Switch checked={settings.hideBotTime} onChange={v => set('hideBotTime', v)} label="Hide bot time" />
              <p className="status">Dots on the bot’s clock; its time shows when the round is decided.</p>
            </div>
          </div>
          <button className="btn pri" type="button" onClick={race.startMatch}>Start race</button>
        </div>
      )}

      {showBoard && (
        <div className="race-board">
          <div className="rb-score">
            <div className="rb-side"><span className="rb-name">You</span><b className="rb-pts">{match.playerPoints}</b><span className="pips" aria-label="Rounds won">{pips(match.playerPoints, match.target)}</span></div>
            <div className="rb-mid">
              <span>{match.matchOver ? 'Match over' : `Best of ${match.bestOf}`}</span>
              <small>{match.matchOver ? `${match.round} ${match.round === 1 ? 'round' : 'rounds'} played` : `Round ${match.round + 1} · first to ${match.target}`}</small>
            </div>
            <div className="rb-side bot"><span className="rb-name">Bot · <span>Sub-{match.level}</span></span><b className="rb-pts">{match.botPoints}</b><span className="pips" aria-label="Rounds won">{pips(match.botPoints, match.target)}</span></div>
          </div>

          <div className="race-scramble-wrap">
            <div className="scr-text"><small>Scramble · same for both</small><div className="race-scramble">{match.scramble}</div></div>
            <CubeNet scramble={match.scramble} />
          </div>

          <div className="race-timers">
            <div className={`race-timer-card player-card ${playerActive && !match.matchOver ? 'active' : ''}`} tabIndex={0} role="button" aria-label="Your timer. Hold and release Space to start, press to stop."
              onPointerDown={e => { e.preventDefault(); race.press(); }} onPointerUp={race.release} onPointerCancel={race.release}>
              <div className="race-timer-label">You</div>
              <div className={`race-timer-value ${playerClass}`}>{display}</div>
              <p>{instruction}</p>
            </div>
            <div className={`race-timer-card bot-card ${match.botPhase === 'solving' ? 'solving' : ''}`}>
              <div className="race-timer-label">Bot</div>
              <div className={`race-timer-value ${botClass}`}>{match.botDisplay}</div>
              <p>{botInstruction}</p>
            </div>
          </div>

          <div className="race-controls">
            <button className="btn pri" type="button" disabled={!(match.matchOver || race.canStart)}
              onClick={e => { if (match.matchOver) race.startMatch(); else race.beginRound(); e.currentTarget.blur(); }}>{readyLabel}</button>
            <span className="status">or press <kbd>Space</kbd> to start the 15 second inspection</span>
          </div>

          <div className="race-log-wrap"><h2>Rounds</h2>
            <div className="tw"><table>
              <thead><tr><th>Round</th><th>You</th><th>Bot</th><th>Point</th><th>Scramble</th></tr></thead>
              <tbody>
                {match.log.length ? match.log.map((item, i) => ({ item, n: i + 1 })).reverse().map(({ item, n }) => (
                  <tr key={n}><td>{n}</td><td>{format(item.player)}{item.penalty && <> <span className="tag p2">+2</span></>}</td><td>{format(item.bot)}</td><td>{point(item.winner)}</td><td className="scr">{item.scramble}</td></tr>
                )) : <tr><td colSpan={5} className="empty">No rounds yet.</td></tr>}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {match.popup && <RacePopup info={match.popup} onClose={race.closePopup} onMain={() => { const again = match.popup.match; race.closePopup(); if (again) race.startMatch(); }} />}
    </section>
  );
}
