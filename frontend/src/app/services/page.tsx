"use client";

import { useEffect, useState } from "react";
import { fetchCategories, fetchServices } from "@/lib/api";
import Link from "next/link";
import type { Category, Service } from "@/lib/api";

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchServices()])
      .then(([c, s]) => { setCategories(c); setServices(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="text-[20px] font-light tracking-wide mb-2">Прайс</h1>
      <p className="text-white/30 text-[12px] mb-8">Выберите категорию или услугу</p>

      <Link href="/booking" className="block mb-10">
        <button className="btn-book">Записаться</button>
      </Link>

      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActive(null)} className={`tag ${!active ? "tag-active" : ""}`}>Все</button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActive(cat.id)} className={`tag ${active === cat.id ? "tag-active" : ""}`}>
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-white/[0.02] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        categories
          .filter((c) => active === null || c.id === active)
          .map((cat) => (
            <div key={cat.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white/30 text-xs">{cat.icon}</span>
                <span className="text-[11px] tracking-[0.12em] uppercase text-white/25">{cat.name}</span>
              </div>
              <div className="space-y-0">
                {services.filter((s) => s.category_id === cat.id).map((svc, i, arr) => (
                  <Link href={`/booking?service=${svc.id}`} key={svc.id}>
                    <div className={`flex justify-between items-center py-4 ${i < arr.length - 1 ? "border-b border-white/[0.03]" : ""}`}>
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-[14px]">{svc.name}</p>
                        <p className="text-[10px] text-white/20 mt-0.5">{cat.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="price">{svc.price.toLocaleString()}₽</span>
                        <span className="text-white/15 text-xs">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {services.filter((s) => s.category_id === cat.id).length === 0 && (
                  <p className="text-white/15 text-sm py-2">Нет услуг в категории</p>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
