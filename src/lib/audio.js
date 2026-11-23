let audioCtx = null;
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && AC) audioCtx = new AC();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* audio is optional */ }
}
function tone(freq, start, length, type = 'sine', volume = 0.18) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), t = audioCtx.currentTime + start;
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain); gain.connect(audioCtx.destination); osc.start(t); osc.stop(t + length + 0.05);
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text); voice.lang = 'en-US'; voice.rate = 1.05; voice.volume = 1;
    window.speechSynthesis.speak(voice);
  } catch { /* voice is optional */ }
}
/** WCA style announcements: a beep and a voice at 8 and 12 seconds of inspection. */
export function announceInspection(seconds, soundOn) {
  if (!soundOn) return;
  unlockAudio();
  tone(880, 0, 0.18); if (seconds === 12) tone(880, 0.26, 0.18);
  speak(`${seconds} seconds`);
}
export function playFanfare(soundOn) {
  if (!soundOn) return;
  unlockAudio();
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, i === 3 ? 0.4 : 0.14, 'triangle', 0.16));
}
