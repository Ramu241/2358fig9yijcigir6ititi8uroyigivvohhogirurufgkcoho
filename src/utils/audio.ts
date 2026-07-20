// Web Audio API Synthesizer for high-fidelity cross-platform sound effects
// Works flawlessly on web browsers, APK webviews, Telegram, and mobile devices.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    // Standard audio context with fallbacks
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  // Resume context if suspended (browser security autoplays)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a beautiful upward arpeggio chime for WINNING outcomes
 */
export function playWinSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // We will play 3 successive rising notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const duration = 0.15; // length of each note
    const spacing = 0.08;  // time between notes start

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle'; // pleasant soft chime sound
      osc.frequency.setValueAtTime(freq, now + index * spacing);

      // Sweet fade-out envelope
      gainNode.gain.setValueAtTime(0.18, now + index * spacing);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * spacing + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + index * spacing);
      osc.stop(now + index * spacing + duration);
    });
  } catch (err) {
    console.warn('Audio play failed (waiting for user interaction):', err);
  }
}

/**
 * Play a downward low frequency swoop alert for LOSS outcomes
 */
export function playLossSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth'; // slightly buzzy alert tone
    osc.frequency.setValueAtTime(220, now); // A3
    // Swoop down to F2 (87Hz)
    osc.frequency.exponentialRampToValueAtTime(87, now + 0.35);

    // Filter to soften the buzz and make it dramatic
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    // Fade-out envelope
    gainNode.gain.setValueAtTime(0.22, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn('Audio play failed (waiting for user interaction):', err);
  }
}
