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
    <div className="pb-28">
      {/* HEADER */}
      <div className="bg-white px-5 pt-10 pb-6 rounded-b-[32px] shadow-sm mb-5">
        <h1 className="text-[28px] font-800 tracking-tight mb-1">Работы</h1>
        <p className="text-[14px] text-black/40">Галерея мастера</p>
      </div>

      <div className="px-5">
        {/* FEATURED CAROUSEL */}
        {loading ? (
          <div className="flex gap-3 mb-6 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="w-[200px] h-[260px] flex-shrink-0 rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="carousel -mx-5 px-5 mb-6">
            {items.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="w-[200px] h-[260px] flex-shrink-0 rounded-2xl overflow-hidden shadow-md relative"
              >
                {item.photo_url ? (
                  <img
                    src={item.photo_url}
                    alt={item.description}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#f0f0f2] to-[#e4e4e8] flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">💅</span>
                    <p className="text-[11px] text-black/25 text-center px-4">{item.description}</p>
                  </div>
                )}
                {item.description && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-3">
                    <p className="text-[11px] text-white font-500">{item.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* GRID */}
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Все работы</p>
          <span className="text-[12px] text-black/30 font-500">{items.length} фото</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white animate-pulse" />
              ))
            : items.map((item) => (
                <div key={`g-${item.id}`} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.description}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#f7f7f9] to-[#eeeef2] flex flex-col items-center justify-center">
                      <span className="text-3xl mb-1.5">💅</span>
                      <p className="text-[10px] text-black/25 text-center px-3">{item.description}</p>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
