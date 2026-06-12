/**
 * audioAlerts.js
 * In-browser audio notification synthesizer utilizing the Web Audio API.
 * Synthesizes dynamic sirens/chimes based on triage urgency to alert ASHA workers.
 * Avoids dependencies on external mp3 assets that could be blocked by CORS or offline limits.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a synthesized sound alert mapped to the triage priority level.
 * @param {string} urgency 'Critical', 'High', 'Medium', 'Low', 'P1', 'P2', 'P3', 'P4'
 */
export function playTriageAlert(urgency) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const isCritical = urgency === 'Critical' || urgency === 'P1' || urgency === 'severe';
    const isWarning = urgency === 'High' || urgency === 'P2' || urgency === 'moderate';

    if (isCritical) {
      // 🔴 P1 Emergency Alert: Dual alternating frequency ambulance siren (sawtooth)
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.setValueAtTime(0.25, now + 1.15);
      gain.gain.linearRampToValueAtTime(0.0, now + 1.2);

      // Alternating frequency (frequency modulation)
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.setValueAtTime(640, now + 0.3);
      osc.frequency.setValueAtTime(960, now + 0.6);
      osc.frequency.setValueAtTime(640, now + 0.9);

      osc.start(now);
      osc.stop(now + 1.2);
      console.log(`[AudioAlert] Synthesized 🔴 Critical P1 Siren.`);

    } else if (isWarning) {
      // 🟡 P2 High Warning: Rapid alternating chime pulses
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.27);
      gain.gain.exponentialRampToValueAtTime(0.0, now + 0.5);

      osc.frequency.setValueAtTime(587.33, now); // D5 note
      osc.frequency.setValueAtTime(698.46, now + 0.25); // F5 note

      osc.start(now);
      osc.stop(now + 0.5);
      console.log(`[AudioAlert] Synthesized 🟡 High/P2 Chime.`);

    } else {
      // 🟢 P4 Normal Chime: Gentle exponential chirp sound
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.frequency.setValueAtTime(523.25, now); // C5 note
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.25); // A5 note slide

      osc.start(now);
      osc.stop(now + 0.4);
      console.log(`[AudioAlert] Synthesized 🟢 Standard Notification Chime.`);
    }
  } catch (err) {
    console.warn('[AudioAlert] Web Audio playback failed:', err.message);
  }
}

export default {
  playTriageAlert
};
