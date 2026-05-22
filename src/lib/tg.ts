"use client";

let WebApp: any = null;

async function getWebApp() {
  if (WebApp) return WebApp;
  if (typeof window === "undefined") return null;
  try {
    const mod = await import("@twa-dev/sdk");
    WebApp = mod.default;
    return WebApp;
  } catch {
    return null;
  }
}

export async function initTG() {
  const wa = await getWebApp();
  if (!wa) return;
  try {
    wa.ready();
    wa.expand();
    wa.setHeaderColor("#000000");
    wa.setBackgroundColor("#000000");
  } catch {}
}

export async function getTGUser() {
  const wa = await getWebApp();
  if (!wa) return { id: "test", name: "Гость" };
  try {
    return {
      id: String(wa.initDataUnsafe?.user?.id || ""),
      name:
        wa.initDataUnsafe?.user?.first_name ||
        wa.initDataUnsafe?.user?.username ||
        "Гость",
    };
  } catch {
    return { id: "test", name: "Гость" };
  }
}

export async function hasWebApp(): Promise<boolean> {
  const wa = await getWebApp();
  return !!wa;
}

export async function sendTGData(data: Record<string, unknown>) {
  const wa = await getWebApp();
  if (!wa) {
    throw new Error("Not in Telegram WebApp");
  }
  try {
    wa.sendData(JSON.stringify(data));
  } catch (e) {
    throw e;
  }
}

export async function isTGAdmin(): Promise<boolean> {
  const wa = await getWebApp();
  if (!wa) return false;
  try {
    const id = wa.initDataUnsafe?.user?.id;
    return id === 784237794;
  } catch {
    return false;
  }
}
