"use client";

import { useEffect, useState } from "react";
import { fetchPortfolio } from "@/lib/api";
import type { PortfolioItem } from "@/lib/api";

const FALLBACK = [
  { id: 1, description: "Наращивание — нюдовый френч" },
  { id: 2, description: "Короткие — молочный цвет" },
  { id: 3, description: "Длинные — зеркальный эффект" },
  { id: 4, description: "Когти — чёрный мат" },
  { id: 5, description: "Покрытие — лунный маникюр" },
  { id: 6, description: "Френч — классический" },
];

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio()
      .then((data) => {
        setItems(
          data.length > 0
            ? data
            : (FALLBACK.map((f) => ({ ...f, photo_url: "" })) as PortfolioItem[])
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="text-[20px] font-light tracking-wide mb-2">Работы</h1>
      <p className="text-white/25 text-[12px] mb-8">
        Портфолио мастера
      </p>

      {loading ? (
        <div className="carousel -mx-5 px-5 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[220px] h-[280px] bg-white/[0.02] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="carousel -mx-5 px-5 mb-10">
          {items.map((item) => (
            <div key={item.id} className="card w-[220px] h-[280px] overflow-hidden flex flex-col">
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.description}
                  className="w-full h-[220px] object-cover"
                />
              ) : (
                <div className="w-full h-[220px] flex items-center justify-center bg-[var(--color-surface-2)]">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-2">
                      <span className="text-white/15 text-lg">◇</span>
                    </div>
                    <span className="text-white/10 text-[10px]">Фото</span>
                  </div>
                </div>
              )}
              <div className="p-3 flex-1 flex items-center">
                <p className="text-[11px] text-white/35">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sep mb-8" />

      <p className="text-[11px] tracking-[0.12em] uppercase text-white/20 mb-4">
        Галерея
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.slice(0, 6).map((item) => (
          <div key={`g-${item.id}`} className="card aspect-square overflow-hidden">
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.description}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-surface-2)]">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center mb-1">
                  <span className="text-white/10 text-sm">◇</span>
                </div>
                <p className="text-[9px] text-white/15 text-center px-2">
                  {item.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
