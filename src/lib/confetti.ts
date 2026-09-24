import confetti from "canvas-confetti";

export function fireConfetti() {
  try {
    const count = 45;
    const defaults = {
      origin: { y: 0.75 },
      zIndex: 9999,
      colors: ["#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6", "#ffffff"],
    };

    void confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.7),
      spread: 60,
      startVelocity: 35,
      scalar: 0.9,
    });

    void confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.3),
      spread: 100,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.1,
    });
  } catch {}
}
