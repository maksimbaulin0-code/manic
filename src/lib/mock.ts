import type { Category, Service, Slot, PortfolioItem } from "./api";

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "Наращивание", icon: "💎", sort_order: 1 },
  { id: 2, name: "Когти", icon: "🖤", sort_order: 2 },
  { id: 3, name: "Покрытие", icon: "✨", sort_order: 3 },
];

export const MOCK_SERVICES: Service[] = [
  // Наращивание
  { id: 1, name: "Наращивание короткие", price: 3500, category_id: 1, category_name: "Наращивание", category_icon: "💎" },
  { id: 2, name: "Наращивание средние", price: 4000, category_id: 1, category_name: "Наращивание", category_icon: "💎" },
  { id: 3, name: "Наращивание длинные", price: 4800, category_id: 1, category_name: "Наращивание", category_icon: "💎" },
  { id: 4, name: "Французский маникюр + наращивание", price: 5200, category_id: 1, category_name: "Наращивание", category_icon: "💎" },
  { id: 5, name: "Коррекция наращивания", price: 2800, category_id: 1, category_name: "Наращивание", category_icon: "💎" },
  // Когти
  { id: 6, name: "Когти стилет", price: 5500, category_id: 2, category_name: "Когти", category_icon: "🖤" },
  { id: 7, name: "Когти балерина", price: 5000, category_id: 2, category_name: "Когти", category_icon: "🖤" },
  { id: 8, name: "Когти квадрат острый", price: 5200, category_id: 2, category_name: "Когти", category_icon: "🖤" },
  // Покрытие
  { id: 9, name: "Гель-лак без дизайна", price: 2200, category_id: 3, category_name: "Покрытие", category_icon: "✨" },
  { id: 10, name: "Гель-лак с простым дизайном", price: 2700, category_id: 3, category_name: "Покрытие", category_icon: "✨" },
  { id: 11, name: "Гель-лак с дизайном художник", price: 3200, category_id: 3, category_name: "Покрытие", category_icon: "✨" },
  { id: 12, name: "Хромовый эффект", price: 3500, category_id: 3, category_name: "Покрытие", category_icon: "✨" },
  { id: 13, name: "Омбре", price: 3000, category_id: 3, category_name: "Покрытие", category_icon: "✨" },
  { id: 14, name: "Снятие покрытия", price: 600, category_id: 3, category_name: "Покрытие", category_icon: "✨" },
];

export const MOCK_SLOTS: Slot[] = [
  { id: 1, date: "27 мая", time: "11:00", status: "free" },
  { id: 2, date: "27 мая", time: "14:00", status: "free" },
  { id: 3, date: "28 мая", time: "10:00", status: "free" },
  { id: 4, date: "28 мая", time: "16:30", status: "free" },
  { id: 5, date: "29 мая", time: "12:00", status: "free" },
  { id: 6, date: "30 мая", time: "13:00", status: "free" },
];

export const MOCK_PORTFOLIO: PortfolioItem[] = [
  { id: 1, photo_url: "/p1.png", description: "Нюдовый французский маникюр" },
  { id: 2, photo_url: "/p4.png", description: "Розовое омбре" },
  { id: 3, photo_url: "/p3.png", description: "Хром серебро" },
  { id: 4, photo_url: "/p2.png", description: "Чёрные миндаль" },
  { id: 5, photo_url: "/p5.png", description: "Молочный минимализм" },
  { id: 6, photo_url: "/p6.png", description: "Цветочный арт" },
];
