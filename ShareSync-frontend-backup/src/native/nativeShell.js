// src/native/nativeShell.js
export function initNativeShell() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const isCapacitor =
    window.location.protocol === "capacitor:" ||
    window.Capacitor?.isNativePlatform?.() ||
    window.Capacitor?.getPlatform?.() === "ios" ||
    window.Capacitor?.getPlatform?.() === "android";

  const platform = window.Capacitor?.getPlatform?.();
  const isiOS =
    platform === "ios" ||
    /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isCapacitor) return;

  document.documentElement.classList.add("native-app");
  document.body.classList.add("native-app");

  if (isiOS) {
    document.documentElement.classList.add("native-ios");
    document.body.classList.add("native-ios");
  }

  console.log("[NativeShell] Native app shell enabled", {
    protocol: window.location.protocol,
    platform: platform || "unknown",
    isiOS,
  });
}
