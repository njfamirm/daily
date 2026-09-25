import { Haptics, NotificationType } from "@capacitor/haptics";

export type AlarmSoundTheme = "marimba" | "radar" | "crystal" | "classic";

export interface AlarmThemeInfo {
  id: AlarmSoundTheme;
  titleFa: string;
  titleEn: string;
  descFa: string;
  descEn: string;
  icon: "music" | "radio" | "sparkles" | "alarm-clock";
}

export const ALARM_SOUND_THEMES: AlarmThemeInfo[] = [
  {
    id: "marimba",
    titleFa: "ماریمبا ملایم",
    titleEn: "Soft Marimba",
    descFa: "چایم هارمونیک و آرام‌بخش با حس طبیعی چوب و نت‌های دلنشین",
    descEn: "Gentle warm wooden marimba chord, non-intrusive and pleasant",
    icon: "music",
  },
  {
    id: "radar",
    titleFa: "رادار مدرن",
    titleEn: "Modern Radar",
    descFa: "پالس دوگانه دقیق و سریع، مناسب برای تسک‌های مهم و هوشیاری سریع",
    descEn: "Snappy double-pulse ping for high awareness and urgency",
    icon: "radio",
  },
  {
    id: "crystal",
    titleFa: "آرپژ کریستالی",
    titleEn: "Crystal Sparkle",
    descFa: "سلسله نت‌های درخشان و صعودی با ریتم شاداب",
    descEn: "Cascading ascending sparkle chords, bright and crisp",
    icon: "sparkles",
  },
  {
    id: "classic",
    titleFa: "ساعت دیجیتال کلاسیک",
    titleEn: "Classic Digital",
    descFa: "بوق ۴ مرحله‌ای سنتی ساعت‌های دیجیتال و کاسیو",
    descEn: "Traditional 4-pulse digital watch beeping pattern",
    icon: "alarm-clock",
  },
];

const THEME_STORAGE_KEY = "taskdrop_alarm_sound_theme";
let audioCtx: AudioContext | null = null;
let ringInterval: number | null = null;
let isRinging = false;

export function getAlarmTheme(): AlarmSoundTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && ALARM_SOUND_THEMES.some((t) => t.id === saved)) {
      return saved as AlarmSoundTheme;
    }
  } catch {
    /* fallback to default */
  }
  return "marimba";
}

export function setAlarmTheme(theme: AlarmSoundTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore storage errors */
  }
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 1. Marimba Tone: Warm harmonic chord with rapid strike and gentle decay
 */
function playMarimba(ctx: AudioContext, now: number) {
  // E5, G#5, B5, E6
  const notes = [659.25, 830.61, 987.77, 1318.51];

  notes.forEach((freq, idx) => {
    const t0 = now + idx * 0.12;

    // Fundamental oscillator (warm triangle)
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, t0);

    // Harmonic overtone oscillator (sine for soft wooden mallet ping)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 3.8, t0);

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    // Natural marimba envelope: sharp attack, exponential decay
    gain1.gain.setValueAtTime(0.0001, t0);
    gain1.gain.exponentialRampToValueAtTime(0.35, t0 + 0.005);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);

    // Overtone dies faster than fundamental
    gain2.gain.setValueAtTime(0.0001, t0);
    gain2.gain.exponentialRampToValueAtTime(0.12, t0 + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + 0.36);
    osc2.stop(t0 + 0.1);
  });
}

/**
 * 2. Modern Radar: Clean dual sonar pings
 */
function playRadar(ctx: AudioContext, now: number) {
  const pings = [
    { freq: 1174.66, time: now },
    { freq: 1567.98, time: now + 0.14 },
    { freq: 1174.66, time: now + 0.4 },
    { freq: 1567.98, time: now + 0.54 },
  ];

  pings.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.04, time + 0.08);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.32, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.12);
  });
}

/**
 * 3. Crystal Sparkle: Rapid 5-note shimmering arpeggio
 */
function playCrystal(ctx: AudioContext, now: number) {
  // C6, D#6, G6, A#6, D7
  const freqs = [1046.5, 1244.51, 1567.98, 1864.66, 2349.32];

  freqs.forEach((freq, idx) => {
    const t0 = now + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t0 + 0.2);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.3);
  });
}

/**
 * 4. Classic Digital: 4-pulse digital beeps
 */
function playClassic(ctx: AudioContext, now: number) {
  const beeps = [0, 0.1, 0.2, 0.3];
  beeps.forEach((offset) => {
    const t0 = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(2048, t0);

    // Low-pass filter to soften the harsh square edges
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.005);
    gain.gain.setValueAtTime(0.18, t0 + 0.045);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + 0.05);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.055);
  });
}

/**
 * Play a single chime / preview cycle of the chosen theme
 */
export function playAlarmSound(theme?: AlarmSoundTheme) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const activeTheme = theme || getAlarmTheme();

    switch (activeTheme) {
      case "marimba":
        playMarimba(ctx, now);
        break;
      case "radar":
        playRadar(ctx, now);
        break;
      case "crystal":
        playCrystal(ctx, now);
        break;
      case "classic":
        playClassic(ctx, now);
        break;
      default:
        playMarimba(ctx, now);
        break;
    }
  } catch {
    /* Web Audio might be blocked if no user gesture has occurred yet */
  }

  // Trigger tactile vibration feedback
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 80, 200, 80, 350]);
    }
    void Haptics.notification({ type: NotificationType.Warning });
  } catch {
    /* Ignore vibration errors */
  }
}

/**
 * Starts continuous alarm ringing (repeats chime every ~1.6s until stopped)
 */
export function startAlarmRing(theme?: AlarmSoundTheme) {
  if (isRinging) return;
  isRinging = true;

  playAlarmSound(theme);
  ringInterval = window.setInterval(() => {
    if (!isRinging) return;
    playAlarmSound(theme);
  }, 1650);
}

/**
 * Stops continuous alarm ringing and halts vibration
 */
export function stopAlarmRing() {
  isRinging = false;
  if (ringInterval !== null) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  } catch {}
}

export function getIsAlarmRinging(): boolean {
  return isRinging;
}
