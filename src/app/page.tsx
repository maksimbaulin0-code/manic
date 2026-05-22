"use client";

import { useEffect, useState } from "react";
import { initTG } from "@/lib/tg";
import { fetchCategories, fetchServices } from "@/lib/api";
import { MOCK_CATEGORIES, MOCK_SERVICES } from "@/lib/mock";
import Link from "next/link";
import type { Category, Service } from "@/lib/api";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await initTG();
      try {
        const [c, s] = await Promise.all([fetchCategories(), fetchServices()]);
        setCategories(c.length > 0 ? c : MOCK_CATEGORIES);
        setServices(s.length > 0 ? s : MOCK_SERVICES);
      } catch {
        setCategories(MOCK_CATEGORIES);
        setServices(MOCK_SERVICES);
      }
      setLoading(false);
    })();
  }, []);

  const getMinPrice = (catId: number) => {
    const catServices = services.filter((s) => s.category_id === catId);
    if (catServices.length === 0) return null;
    return Math.min(...catServices.map((s) => s.price));
  };

  return (
    <div className="pb-28">
      {/* HERO */}
      <div className="relative bg-white rounded-b-[36px] px-5 pt-10 pb-8 mb-5 shadow-sm overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[var(--color-accent)] opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-purple-300 opacity-15 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-xs">✦</span>
            </div>
            <span className="text-[13px] font-700 tracking-wide text-black/40 uppercase">Alimsa Nail</span>
          </div>

          <h1 className="text-[34px] font-800 leading-tight tracking-tight text-black mb-2">
            Маникюр<br />в Москве
          </h1>
          <p className="text-[14px] text-black/40 mb-8 leading-relaxed max-w-[240px]">
            Запись онлайн — выбери услугу и свободное время
          </p>

          <Link href="/booking" className="block">
            <button className="btn-book">Записаться →</button>
          </Link>
          <Link href="/services" className="block mt-3">
            <button className="btn-ghost">Посмотреть прайс</button>
          </Link>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="px-5 mb-5">
        <p className="section-label mb-4">Категории</p>
        <div className="grid grid-cols-3 gap-3">
          {loading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="card p-4 h-24 animate-pulse bg-white/80" />
              ))
            : categories.map((cat) => {
                const minPrice = getMinPrice(cat.id);
                return (
                  <Link href="/services" key={cat.id}>
                    <div className="card p-4 text-center active:scale-95 transition-transform duration-150">
                      <span className="text-2xl block mb-2">{cat.icon}</span>
                      <p className="text-[12px] font-700 text-black leading-tight">{cat.name}</p>
                      {minPrice && (
                        <p className="text-[11px] text-black/35 mt-1 font-500">
                          от {minPrice.toLocaleString()}₽
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>

      {/* PRICE LIST */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">Прайс-лист</p>
          <Link href="/services">
            <span className="text-[12px] font-600 text-black/40">Все →</span>
          </Link>
        </div>

        {loading ? (
          <div className="card p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-black/[0.04] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {categories.map((cat) => {
              const catServices = services.filter((s) => s.category_id === cat.id);
              if (catServices.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div className="px-5 py-3 bg-[var(--color-surface-2)]">
                    <p className="text-[11px] font-700 text-black/40 uppercase tracking-widest">
                      {cat.icon} {cat.name}
                    </p>
                  </div>
                  {catServices.map((svc, i, arr) => (
                    <Link href={`/booking?service=${svc.id}`} key={svc.id}>
                      <div className={`flex justify-between items-center px-5 py-4 active:bg-[var(--color-surface-2)] ${i < arr.length - 1 ? "border-b border-black/[0.05]" : ""}`}>
                        <span className="text-[14px] font-500 text-black">{svc.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="price">{svc.price.toLocaleString()}₽</span>
                          <span className="text-black/20 text-sm">›</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
            {categories.length === 0 && (
              <div className="py-12 text-center px-5">
                <p className="text-black/25 text-sm">Прайс пока не заполнен</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
