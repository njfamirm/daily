import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const isNative = Capacitor.isNativePlatform();

export async function hapticLight(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
  } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(10);
    } catch {}
  }
}

export async function hapticMedium(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(25);
    } catch {}
  }
}

export async function hapticSuccess(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
  } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([15, 50, 25]);
    } catch {}
  }
}

export async function hapticWarning(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {}
  } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([30, 40, 30]);
    } catch {}
  }
}

export async function hapticSelection(): Promise<void> {
  if (isNative) {
    try {
      await Haptics.selectionChanged();
    } catch {}
  }
}
