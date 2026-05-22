"use client";

import { useEffect, useState } from "react";
import {
  fetchCategories,
  fetchServices,
  fetchAllSlots,
  fetchBookings,
  fetchPortfolio,
  addCategory,
  deleteCategory,
  addService,
  deleteService,
  updateService,
  addSlot,
  deleteSlot,
  uploadPortfolio,
  deletePortfolio,
  setApiBase,
  DEFAULT_API_URL,
} from "@/lib/api";
import type { Category, Service, Slot, Booking, PortfolioItem } from "@/lib/api";

type Tab = "bookings" | "slots" | "services" | "categories" | "portfolio";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [editingPrice, setEditingPrice] = useState<Record<number, string>>({});
  const [editingName, setEditingName] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [apiUrl, setApiUrl] = useState("");

  // Category form
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("◆");

  // Service form
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcCat, setSvcCat] = useState<number>(0);

  // Slot form
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  // Portfolio form
  const [portDesc, setPortDesc] = useState("");
  const [portFile, setPortFile] = useState<File | null>(null);

  const loadAll = async () => {
    setErr("");
    if (!apiUrl) { setLoading(false); return; }
    try {
      const [c, s, sl, b, p] = await Promise.all([
        fetchCategories(), fetchServices(), fetchAllSlots(), fetchBookings(), fetchPortfolio(),
      ]);
      setCategories(c);
      setServices(s);
      setSlots(sl);
      setBookings(b);
      setPortfolio(p);
      if (c.length > 0 && svcCat === 0) setSvcCat(c[0].id);
    } catch (e: any) {
      setErr(e.message || "Не удалось загрузить данные");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("alimsa_api_url") || DEFAULT_API_URL;
      setApiUrl(saved);
    }
  }, []);

  useEffect(() => {
    if (apiUrl) loadAll().finally(() => setLoading(false));
    else setLoading(false);
  }, [apiUrl]);

  // Category handlers
  const handleAddCat = async () => {
    if (!catName) return;
    try { await addCategory(catName, catIcon); setCatName(""); loadAll(); }
    catch { setErr("Не удалось добавить категорию"); }
  };
  const handleDelCat = async (id: number) => {
    try { await deleteCategory(id); loadAll(); }
    catch { setErr("Не удалось удалить категорию"); }
  };

  // Service handlers
  const handleAddSvc = async () => {
    if (!svcName || !svcPrice || !svcCat) return;
    try { await addService(svcName, parseInt(svcPrice), svcCat); setSvcName(""); setSvcPrice(""); loadAll(); }
    catch { setErr("Не удалось добавить услугу"); }
  };
  const handleDelSvc = async (id: number) => {
    try { await deleteService(id); loadAll(); }
    catch { setErr("Не удалось удалить услугу"); }
  };
  const handleSavePrice = async (id: number) => {
    const p = parseInt(editingPrice[id]);
    if (!p) return;
    try { await updateService(id, undefined, p); setServices(prev => prev.map(s => s.id === id ? { ...s, price: p } : s)); setEditingPrice(prev => { const n = { ...prev }; delete n[id]; return n; }); }
    catch { setErr("Не удалось обновить цену"); }
  };
  const handleSaveName = async (id: number) => {
    const n = editingName[id]?.trim();
    if (!n) return;
    try { await updateService(id, n); setServices(prev => prev.map(s => s.id === id ? { ...s, name: n } : s)); setEditingName(prev => { const x = { ...prev }; delete x[id]; return x; }); }
    catch { setErr("Не удалось обновить название"); }
  };

  // Slot handlers
  const handleAddSlot = async () => {
    if (!slotDate || !slotTime) return;
    try { await addSlot(slotDate, slotTime); setSlotDate(""); setSlotTime(""); loadAll(); }
    catch { setErr("Не удалось добавить слот"); }
  };
  const handleDelSlot = async (id: number) => {
    try { await deleteSlot(id); loadAll(); }
    catch { setErr("Не удалось удалить слот"); }
  };

  // Portfolio handlers
  const handleAddPortfolio = async () => {
    if (!portFile) return;
    try {
      await uploadPortfolio(portFile, portDesc);
      setPortFile(null); setPortDesc(""); loadAll();
    } catch { setErr("Не удалось загрузить фото"); }
  };
  const handleDelPortfolio = async (id: number) => {
    try { await deletePortfolio(id); loadAll(); }
    catch { setErr("Не удалось удалить фото"); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "bookings", label: "Записи" },
    { key: "slots", label: "Слоты" },
    { key: "services", label: "Прайс" },
    { key: "categories", label: "Категории" },
    { key: "portfolio", label: "Фото" },
  ];

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="text-[20px] font-light tracking-wide mb-2">Мастер</h1>
      <p className="text-white/25 text-[12px] mb-6">Управление студией</p>

      {/* API URL */}
      <div className="card p-4 mb-6">
        <p className="text-[10px] tracking-wide text-white/25 uppercase mb-2">API URL</p>
        <div className="flex gap-2 mb-2">
          <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://..." className="field text-[12px] !py-2.5" />
          <button onClick={() => { setApiBase(apiUrl); setErr(""); loadAll(); }} className="btn-book !w-auto !px-3 !py-2.5 text-[12px]">OK</button>
        </div>
        {!apiUrl && (
          <div className="text-[11px] text-white/30 mt-1 space-y-0.5">
            <p>1. Запустите: ./start.sh</p>
            <p>2. Вставьте https:// URL из ngrok</p>
          </div>
        )}
      </div>

      {err && (
        <div className="card p-4 mb-6 border-red-400/20">
          <p className="text-red-400/60 text-[13px]">{err}</p>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-[12px] tracking-wide pb-1 border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "text-white border-white" : "text-white/20 border-transparent"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={loadAll} className="text-[11px] text-white/25 hover:text-white/50 transition-colors ml-4">Обновить</button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-white/[0.02] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* BOOKINGS */}
          {tab === "bookings" && (
            <div>
              {bookings.length === 0 ? (
                <div className="py-12 text-center"><p className="text-white/20 text-sm">Нет записей</p></div>
              ) : (
                <div className="space-y-0">
                  {bookings.map((b) => (
                    <div key={b.id} className="py-4 border-b border-white/[0.03]">
                      <p className="text-[13px]">{b.name} — {b.price}₽</p>
                      <p className="text-[11px] text-white/25">{b.date} в {b.time}</p>
                      {b.comment && <p className="text-[11px] text-white/35 mt-1.5">💬 {b.comment}</p>}
                      {b.photo_wish && (
                        b.photo_wish.startsWith('/uploads/') ? (
                          <img src={b.photo_wish} alt="Референс" className="mt-1.5 w-24 h-24 object-cover rounded-lg" />
                        ) : (
                          <p className="text-[11px] text-white/35 mt-0.5">📸 {b.photo_wish}</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SLOTS */}
          {tab === "slots" && (
            <div>
              <div className="flex gap-2 mb-6">
                <input value={slotDate} onChange={e => setSlotDate(e.target.value)} placeholder="Дата" className="field flex-1" />
                <input value={slotTime} onChange={e => setSlotTime(e.target.value)} placeholder="Время" className="field !w-24" />
                <button onClick={handleAddSlot} className="btn-book !w-auto !px-4 !py-3">+</button>
              </div>
              {slots.length === 0 ? <div className="py-12 text-center"><p className="text-white/20 text-sm">Нет слотов</p></div> : (
                <div>
                  {slots.map((slot) => (
                    <div key={slot.id} className="flex justify-between items-center py-3.5 border-b border-white/[0.03]">
                      <div className="flex items-center gap-3">
                        {slot.status === "free" ? <span className="status-free" /> : <span className="status-booked" />}
                        <span className="text-[13px]">{slot.date}</span>
                        <span className="text-[12px] text-white/30">{slot.time}</span>
                      </div>
                      <button onClick={() => handleDelSlot(slot.id)} className="text-[11px] text-white/15 hover:text-white/30 px-2">Удалить</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICES */}
          {tab === "services" && (
            <div>
              <div className="mb-6 space-y-2">
                <input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="Название услуги" className="field" />
                <div className="flex gap-2">
                  <input value={svcPrice} onChange={e => setSvcPrice(e.target.value)} placeholder="Цена" type="number" className="field !w-28" />
                  <select value={svcCat} onChange={e => setSvcCat(Number(e.target.value))} className="field flex-1">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                  <button onClick={handleAddSvc} className="btn-book !w-auto !px-4 !py-3">+</button>
                </div>
              </div>

              {categories.map((cat) => (
                <div key={cat.id} className="mb-6">
                  <p className="text-[11px] tracking-[0.12em] uppercase text-white/25 mb-3">{cat.icon} {cat.name}</p>
                  <div className="space-y-0">
                    {services.filter((s) => s.category_id === cat.id).map((svc) => (
                      <div key={svc.id} className="flex justify-between items-center py-3 border-b border-white/[0.03]">
                        <div className="flex-1 min-w-0 mr-3">
                          {editingName[svc.id] !== undefined ? (
                            <div className="flex items-center gap-2">
                              <input value={editingName[svc.id]} onChange={e => setEditingName(p => ({ ...p, [svc.id]: e.target.value }))} className="field !py-1.5 text-[13px]" autoFocus />
                              <button onClick={() => handleSaveName(svc.id)} className="text-white/40 text-[13px] px-1">✓</button>
                            </div>
                          ) : (
                            <p className="text-[13px] truncate cursor-pointer" onClick={() => setEditingName(p => ({ ...p, [svc.id]: svc.name }))}>{svc.name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingPrice[svc.id] !== undefined ? (
                            <>
                              <input type="number" value={editingPrice[svc.id]} onChange={e => setEditingPrice(p => ({ ...p, [svc.id]: e.target.value }))} className="field !w-16 !py-1.5 !px-2 text-right text-[13px]" autoFocus />
                              <button onClick={() => handleSavePrice(svc.id)} className="text-white/40 text-[13px] px-1">✓</button>
                            </>
                          ) : (
                            <button onClick={() => setEditingPrice(p => ({ ...p, [svc.id]: String(svc.price) }))} className="text-[13px] text-white/30">
                              {svc.price.toLocaleString()}₽
                            </button>
                          )}
                          <button onClick={() => handleDelSvc(svc.id)} className="text-[11px] text-white/10 hover:text-white/25 px-1">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === "categories" && (
            <div>
              <div className="flex gap-2 mb-6">
                <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Название категории" className="field flex-1" />
                <input value={catIcon} onChange={e => setCatIcon(e.target.value)} placeholder="◆" className="field !w-20 text-center" />
                <button onClick={handleAddCat} className="btn-book !w-auto !px-4 !py-3">+</button>
              </div>
              {categories.length === 0 ? <div className="py-12 text-center"><p className="text-white/20 text-sm">Нет категорий</p></div> : (
                <div className="space-y-0">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex justify-between items-center py-3.5 border-b border-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-[14px]">{cat.name}</span>
                        <span className="text-[11px] text-white/20">({services.filter(s => s.category_id === cat.id).length} услуг)</span>
                      </div>
                      <button onClick={() => handleDelCat(cat.id)} className="text-[11px] text-white/15 hover:text-white/30 px-2">Удалить</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PORTFOLIO */}
          {tab === "portfolio" && (
            <div>
              <div className="mb-6 space-y-3">
                <div className="card p-6 text-center cursor-pointer relative">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPortFile(e.target.files?.[0] || null)} />
                  <span className="text-white/30 text-sm">{portFile ? `Выбрано: ${portFile.name}` : "Нажмите чтобы выбрать фото"}</span>
                </div>
                <input value={portDesc} onChange={e => setPortDesc(e.target.value)} placeholder="Описание фото" className="field" />
                <button onClick={handleAddPortfolio} disabled={!portFile} className="btn-book disabled:opacity-20">Загрузить фото</button>
              </div>

              {portfolio.length === 0 ? <div className="py-12 text-center"><p className="text-white/20 text-sm">Нет фото</p></div> : (
                <div className="grid grid-cols-2 gap-3">
                  {portfolio.map((item) => (
                    <div key={item.id} className="card overflow-hidden relative">
                      {item.photo_url ? (
                        <img src={`${apiUrl}${item.photo_url}`} alt={item.description} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-[var(--color-surface-2)]">
                          <span className="text-white/10 text-2xl">◇</span>
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-[11px] text-white/40">{item.description}</p>
                      </div>
                      <button onClick={() => handleDelPortfolio(item.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white/60 text-xs flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
