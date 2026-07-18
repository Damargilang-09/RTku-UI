export type DeviceType = "mobile" | "desktop";

export function detectDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";

  const ua = navigator.userAgent;

  if (/Android|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";

  // iPad modern (iPadOS 13+) menyamar sebagai "Macintosh" di user-agent,
  // jadi kita cek juga kemampuan touch untuk membedakannya dari Mac asli.
  const isMacUA = /Macintosh/i.test(ua);
  const hasTouch = navigator.maxTouchPoints > 1;
  if (isMacUA && hasTouch) return "mobile";

  if (/iPad/i.test(ua)) return "mobile"; // fallback iPad lama

  return "desktop";
}