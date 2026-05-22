export const DEFAULT_API_URL = "http://localhost:8080";

function getApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  const saved = localStorage.getItem("alimsa_api_url");
  if (saved) return saved;
  if (window.location.hostname.includes("ngrok")) return window.location.origin;
  return DEFAULT_API_URL;
}

export function setApiBase(url: string) {
  if (typeof window !== "undefined") localStorage.setItem("alimsa_api_url", url);
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
}

export interface Slot {
  id: number;
  date: string;
  time: string;
  status: string;
}

export interface PortfolioItem {
  id: number;
  photo_url: string;
  description: string;
}

export interface Booking {
  id: number;
  name: string;
  price: number;
  date: string;
  time: string;
  comment: string;
  photo_wish: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const txt = await res.text();
      console.error(`API ${path} error ${res.status}:`, txt);
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (e: any) {
    console.error(`API ${path} failed (base=${url}):`, e);
    if (e.message?.includes("Failed to fetch") || e.message?.includes("NetworkError")) {
      throw new Error(`Сервер недоступен. Убедитесь, что бот запущен.`);
    }
    throw e;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/api/categories");
}

export async function fetchServices(): Promise<Service[]> {
  return apiFetch<Service[]>("/api/services");
}

export async function fetchSlots(): Promise<Slot[]> {
  return apiFetch<Slot[]>("/api/slots");
}

export async function fetchAllSlots(): Promise<Slot[]> {
  return apiFetch<Slot[]>("/api/all-slots");
}

export async function fetchPortfolio(): Promise<PortfolioItem[]> {
  return apiFetch<PortfolioItem[]>("/api/portfolio");
}

export async function fetchBookings(): Promise<Booking[]> {
  return apiFetch<Booking[]>("/api/bookings");
}

// Categories
export async function addCategory(name: string, icon: string): Promise<{ ok: boolean; id: number }> {
  return apiFetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, icon }),
  });
}

export async function deleteCategory(id: number): Promise<{ ok: boolean }> {
  return apiFetch("/api/categories", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

// Services
export async function addService(name: string, price: number, category_id: number): Promise<{ ok: boolean; id: number }> {
  return apiFetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, category_id }),
  });
}

export async function deleteService(id: number): Promise<{ ok: boolean }> {
  return apiFetch("/api/services", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function updateService(id: number, name?: string, price?: number): Promise<{ ok: boolean }> {
  const body: any = { id };
  if (name !== undefined) body.name = name;
  if (price !== undefined) body.price = price;
  return apiFetch("/api/services", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Slots
export async function addSlot(date: string, time: string): Promise<{ ok: boolean; id: number }> {
  return apiFetch("/api/slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, time }),
  });
}

export async function deleteSlot(id: number): Promise<{ ok: boolean }> {
  return apiFetch("/api/slots", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function updatePrice(id: number, price: number): Promise<{ ok: boolean }> {
  return apiFetch("/api/update-price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, price }),
  });
}

// Booking
export async function createBooking(data: {
  service_id: number;
  slot_id: number;
  user_id: string;
  user_name: string;
  comment: string;
  photo_wish: string;
}): Promise<{ ok: boolean; id: number }> {
  return apiFetch("/api/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function uploadFile(file: File): Promise<{ ok: boolean; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/api/upload", {
    method: "POST",
    body: formData,
  });
}

// Portfolio
export async function uploadPortfolio(photo: File, description: string): Promise<{ ok: boolean; id: number; url: string }> {
  const formData = new FormData();
  formData.append("photo", photo);
  formData.append("description", description);
  return apiFetch("/api/portfolio", {
    method: "POST",
    body: formData,
  });
}

export async function deletePortfolio(id: number): Promise<{ ok: boolean }> {
  return apiFetch("/api/portfolio", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}
