import confetti from "canvas-confetti";

export function fireConfettiAt(
  event?: React.MouseEvent | { clientX: number; clientY: number } | null,
) {
  try {
    let originX = 0.5;
    let originY = 0.6;

    if (event && typeof event.clientX === "number" && typeof event.clientY === "number") {
      originX = Math.max(0.05, Math.min(0.95, event.clientX / window.innerWidth));
      originY = Math.max(0.05, Math.min(0.95, event.clientY / window.innerHeight));
    }

    const count = 40;
    const defaults = {
      origin: { x: originX, y: originY },
      zIndex: 9999,
      colors: ["#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6", "#ffffff"],
    };

    void confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.7),
      spread: 60,
      startVelocity: 28,
      scalar: 0.85,
    });

    void confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.3),
      spread: 100,
      startVelocity: 20,
      decay: 0.92,
      scalar: 1.05,
    });
  } catch {}
}
