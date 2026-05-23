"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchCategories, fetchServices } from "@/lib/api";
import { MOCK_CATEGORIES, MOCK_SERVICES } from "@/lib/mock";
import Link from "next/link";
import type { Category, Service } from "@/lib/api";

function ServicesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialCategory) {
      setActive(Number(initialCategory));
    }
  }, [initialCategory]);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchServices()])
      .then(([c, s]) => {
        setCategories(c.length > 0 ? c : MOCK_CATEGORIES);
        setServices(s.length > 0 ? s : MOCK_SERVICES);
      })
      .catch(() => {
        setCategories(MOCK_CATEGORIES);
        setServices(MOCK_SERVICES);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-28">
      {/* HEADER */}
      <div className="bg-white px-5 pt-10 pb-6 rounded-b-[32px] shadow-sm mb-5">
        <h1 className="text-[28px] font-800 tracking-tight mb-1">Прайс</h1>
        <p className="text-[14px] text-black/40 mb-5">Выберите услугу для записи</p>
        <Link href="/booking" className="block">
          <button className="btn-book">Записаться →</button>
        </Link>
      </div>

      {/* FILTER TABS */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActive(null)}
            className={`tag ${!active ? "tag-active" : ""}`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`tag ${active === cat.id ? "tag-active" : ""}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div className="px-5">
        {loading ? (
          <div className="card overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 border-b border-black/[0.05] animate-pulse bg-black/[0.02] last:border-0" />
            ))}
          </div>
        ) : (
          categories
            .filter((c) => active === null || c.id === active)
            .map((cat) => {
              const catServices = services.filter((s) => s.category_id === cat.id);
              return (
                <div key={cat.id} className="mb-4">
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[12px] font-700 text-black/40 uppercase tracking-widest">{cat.name}</span>
                  </div>

                  <div className="card overflow-hidden">
                    {catServices.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-[13px] text-black/25">Нет услуг</p>
                      </div>
                    ) : (
                      catServices.map((svc, i, arr) => (
                        <Link href={`/booking?service=${svc.id}`} key={svc.id}>
                          <div
                            className={`flex justify-between items-center px-5 py-4 active:bg-[var(--color-surface-2)] transition-colors ${
                              i < arr.length - 1 ? "border-b border-black/[0.05]" : ""
                            }`}
                          >
                            <div>
                              <p className="text-[14px] font-600 text-black">{svc.name}</p>
                              <p className="text-[11px] text-black/30 mt-0.5">{cat.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] font-700 text-black">
                                {svc.price.toLocaleString()}₽
                              </span>
                              <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                                <span className="text-[12px] font-700">›</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-28">
          <div className="bg-white px-5 pt-10 pb-6 rounded-b-[32px] shadow-sm mb-5">
            <h1 className="text-[28px] font-800 tracking-tight mb-1">Прайс</h1>
            <p className="text-[14px] text-black/40 mb-5">Загрузка...</p>
          </div>
          <div className="px-5">
            <div className="card overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 border-b border-black/[0.05] animate-pulse bg-black/[0.02] last:border-0" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
