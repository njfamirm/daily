const BASE_TITLE = "TaskDrop";

let audioCtx: AudioContext | null = null;

/** Short synthetic 2-tone chime using Web Audio API (offline-ready, zero asset dependency) */
export function beep(times = 2) {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const ctx = audioCtx;
    for (let i = 0; i < times; i++) {
      const t0 = ctx.currentTime + i * 0.35;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.setValueAtTime(1320, t0 + 0.12);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.3);
    }
  } catch {
    /* Audio output is optional */
  }
}

/** Unlocks AudioContext on first user interaction so future alarms can play sound */
export function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
  } catch {
    /* ignore */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "default") return await Notification.requestPermission();
  return Notification.permission;
}

export function notify(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, tag: `taskdrop-${title}`, requireInteraction: true });
  n.onclick = () => {
    window.focus();
    n.close();
  };
}

let faviconAnim: number | null = null;

function drawFavicon(count: number, flip: boolean) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return;

  g.fillStyle = count > 0 && flip ? "#ffffff" : "#000000";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = count > 0 && flip ? "#000000" : "#ffffff";
  g.lineWidth = 6;
  g.lineCap = "round";

  // Checkmark
  g.beginPath();
  g.moveTo(16, 34);
  g.lineTo(28, 46);
  g.lineTo(48, 20);
  g.stroke();

  if (count > 0) {
    g.fillStyle = "#ef4444";
    g.beginPath();
    g.arc(size - 15, 15, 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffffff";
    g.font = "bold 20px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(count > 9 ? "9+" : String(count), size - 15, 16);
  }

  let link = document.querySelector<HTMLLinkElement>("link#favicon");
  if (!link) {
    link = document.createElement("link");
    link.id = "favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = c.toDataURL("image/png");
}

/** Updates tab title and animated favicon badge when tasks are overdue */
export function setBadge(count: number) {
  if (faviconAnim !== null) {
    clearInterval(faviconAnim);
    faviconAnim = null;
  }
  document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE;
  drawFavicon(count, false);
  if (count > 0) {
    let flip = false;
    faviconAnim = window.setInterval(() => {
      flip = !flip;
      drawFavicon(count, flip);
    }, 800);
  }
}
