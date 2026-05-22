"use client";

import { useEffect, useState } from "react";
import { initTG } from "@/lib/tg";
import { fetchCategories, fetchServices } from "@/lib/api";
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
        setCategories(c);
        setServices(s);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const getMinPrice = (catId: number) => {
    const catServices = services.filter((s) => s.category_id === catId);
    if (catServices.length === 0) return null;
    return Math.min(...catServices.map((s) => s.price));
  };

  return (
    <div className="pb-24">
      <div className="px-5 pt-6 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-px h-8 bg-white/10" />
          <div>
            <h1 className="text-[26px] font-light tracking-[0.18em] uppercase">Alimsa</h1>
            <p className="text-white/25 text-[10px] tracking-[0.5em] uppercase mt-1">nail studio</p>
          </div>
        </div>
        <p className="text-white/40 text-[13px] leading-relaxed max-w-[280px]">Маникюр и наращивание в Москве</p>
      </div>

      <div className="px-5">
        <Link href="/booking" className="block">
          <button className="btn-book">Записаться</button>
        </Link>
        <Link href="/services" className="block mt-3 mb-6">
          <button className="btn-ghost text-white/40">Посмотреть прайс →</button>
        </Link>

        <div className="sep my-10" />

        <div className="grid grid-cols-3 gap-2 mb-10">
          {categories.map((cat) => {
            const minPrice = getMinPrice(cat.id);
            return (
              <Link href="/services" key={cat.id}>
                <div className="card p-4 text-center">
                  <span className="text-lg block mb-1.5 opacity-50">{cat.icon}</span>
                  <span className="text-[11px] text-white/50">{cat.name}</span>
                  <span className="text-[10px] text-white/20 block mt-0.5">
                    {minPrice ? `от ${minPrice.toLocaleString()}₽` : "—"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="sep mb-10" />

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-white/[0.02] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-white/25 mb-5">Прайс-лист</p>
            {categories.map((cat) => (
              <div key={cat.id} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white/30 text-xs">{cat.icon}</span>
                  <span className="text-[11px] tracking-wide text-white/25 uppercase">{cat.name}</span>
                </div>
                <div className="space-y-0">
                  {services.filter((s) => s.category_id === cat.id).map((svc, i, arr) => (
                    <div key={svc.id} className={`flex justify-between items-center py-3.5 ${i < arr.length - 1 ? "border-b border-white/[0.03]" : ""}`}>
                      <span className="text-[13px] text-white/60">{svc.name}</span>
                      <span className="price text-white/70">{svc.price.toLocaleString()}₽</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
