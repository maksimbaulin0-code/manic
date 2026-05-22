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

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "bookings", label: "Записи", icon: "📋" },
  { key: "slots", label: "Слоты", icon: "📅" },
  { key: "services", label: "Прайс", icon: "💅" },
  { key: "categories", label: "Категории", icon: "🗂" },
  { key: "portfolio", label: "Фото", icon: "📷" },
];

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

  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("◆");
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcCat, setSvcCat] = useState<number>(0);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [portDesc, setPortDesc] = useState("");
  const [portFile, setPortFile] = useState<File | null>(null);

  const loadAll = async () => {
    setErr("");
    try {
      const [c, s, sl, b, p] = await Promise.all([
        fetchCategories(), fetchServices(), fetchAllSlots(), fetchBookings(), fetchPortfolio(),
      ]);
      setCategories(c); setServices(s); setSlots(sl); setBookings(b); setPortfolio(p);
      if (c.length > 0 && svcCat === 0) setSvcCat(c[0].id);
    } catch (e: any) {
      setErr(e.message || "Не удалось загрузить данные");
    }
  };

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

  const handleAddCat = async () => {
    if (!catName) return;
    try { await addCategory(catName, catIcon); setCatName(""); loadAll(); }
    catch { setErr("Не удалось добавить категорию"); }
  };
  const handleDelCat = async (id: number) => {
    try { await deleteCategory(id); loadAll(); }
    catch { setErr("Не удалось удалить категорию"); }
  };
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
  const handleAddSlot = async () => {
    if (!slotDate || !slotTime) return;
    try { await addSlot(slotDate, slotTime); setSlotDate(""); setSlotTime(""); loadAll(); }
    catch { setErr("Не удалось добавить слот"); }
  };
  const handleDelSlot = async (id: number) => {
    try { await deleteSlot(id); loadAll(); }
    catch { setErr("Не удалось удалить слот"); }
  };
  const handleAddPortfolio = async () => {
    if (!portFile) return;
    try { await uploadPortfolio(portFile, portDesc); setPortFile(null); setPortDesc(""); loadAll(); }
    catch { setErr("Не удалось загрузить фото"); }
  };
  const handleDelPortfolio = async (id: number) => {
    try { await deletePortfolio(id); loadAll(); }
    catch { setErr("Не удалось удалить фото"); }
  };

  return (
    <div className="pb-28">
      {/* HEADER */}
      <div className="bg-white px-5 pt-10 pb-5 rounded-b-[32px] shadow-sm mb-5">
        <h1 className="text-[28px] font-800 tracking-tight mb-0.5">Мастер</h1>
        <p className="text-[14px] text-black/40">Управление студией</p>
      </div>

      <div className="px-5">
        {err && (
          <div className="card p-4 mb-4 border-2 border-red-200 bg-red-50">
            <p className="text-red-500 text-[13px] font-500">{err}</p>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-600 whitespace-nowrap transition-all ${
                tab === t.key
                  ? "bg-black text-white shadow-md"
                  : "bg-white text-black/40 shadow-sm"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 border-b border-black/[0.05] animate-pulse last:border-0" />
            ))}
          </div>
        ) : (
          <>
            {/* BOOKINGS */}
            {tab === "bookings" && (
              <div className="fade-up">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-label">{bookings.length} записей</p>
                  <button onClick={loadAll} className="text-[12px] font-600 text-black/30">Обновить</button>
                </div>
                {bookings.length === 0 ? (
                  <div className="card p-10 text-center">
                    <span className="text-4xl block mb-2">📋</span>
                    <p className="text-black/30 text-sm font-500">Нет записей</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    {bookings.map((b, i) => (
                      <div key={b.id} className={`p-5 ${i < bookings.length - 1 ? "border-b border-black/[0.05]" : ""}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[14px] font-700">{b.name}</p>
                          <span className="chip">{b.price}₽</span>
                        </div>
                        <p className="text-[12px] text-black/40">{b.date} в {b.time}</p>
                        {b.comment && <p className="text-[12px] text-black/50 mt-2 bg-black/[0.04] rounded-xl px-3 py-2">💬 {b.comment}</p>}
                        {b.photo_wish && !b.photo_wish.startsWith('/uploads/') && (
                          <p className="text-[11px] text-black/30 mt-1.5">📸 {b.photo_wish}</p>
                        )}
                        {b.photo_wish && b.photo_wish.startsWith('/uploads/') && (
                          <img src={b.photo_wish} alt="Референс" className="mt-2 w-20 h-20 object-cover rounded-xl" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SLOTS */}
            {tab === "slots" && (
              <div className="fade-up">
                <div className="card p-4 mb-4">
                  <p className="section-label mb-3">Добавить слот</p>
                  <div className="flex gap-2">
                    <input value={slotDate} onChange={e => setSlotDate(e.target.value)} placeholder="Дата (напр. 25 мая)" className="field flex-1" />
                    <input value={slotTime} onChange={e => setSlotTime(e.target.value)} placeholder="Время" className="field" style={{width: '90px'}} />
                    <button onClick={handleAddSlot} className="btn-sm px-4">+</button>
                  </div>
                </div>

                {slots.length === 0 ? (
                  <div className="card p-10 text-center">
                    <span className="text-4xl block mb-2">📅</span>
                    <p className="text-black/30 text-sm font-500">Нет слотов</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    {slots.map((slot, i) => (
                      <div key={slot.id} className={`flex justify-between items-center px-5 py-4 ${i < slots.length - 1 ? "border-b border-black/[0.05]" : ""}`}>
                        <div className="flex items-center gap-3">
                          {slot.status === "free" ? <span className="status-free" /> : <span className="status-booked" />}
                          <div>
                            <p className="text-[14px] font-600">{slot.date}</p>
                            <p className="text-[12px] text-black/35">{slot.time}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelSlot(slot.id)}
                          className="text-[12px] font-600 text-red-400 bg-red-50 px-3 py-1.5 rounded-full"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SERVICES */}
            {tab === "services" && (
              <div className="fade-up">
                <div className="card p-4 mb-4">
                  <p className="section-label mb-3">Добавить услугу</p>
                  <div className="space-y-2">
                    <input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="Название услуги" className="field" />
                    <div className="flex gap-2">
                      <input value={svcPrice} onChange={e => setSvcPrice(e.target.value)} placeholder="Цена" type="number" className="field" style={{width: '100px'}} />
                      <select value={svcCat} onChange={e => setSvcCat(Number(e.target.value))} className="field flex-1">
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                      <button onClick={handleAddSvc} className="btn-sm px-4">+</button>
                    </div>
                  </div>
                </div>

                {categories.map((cat) => (
                  <div key={cat.id} className="mb-4">
                    <p className="section-label mb-2 px-1">{cat.icon} {cat.name}</p>
                    <div className="card overflow-hidden">
                      {services.filter((s) => s.category_id === cat.id).length === 0 ? (
                        <div className="p-5 text-center"><p className="text-black/25 text-sm">Пусто</p></div>
                      ) : (
                        services.filter((s) => s.category_id === cat.id).map((svc, i, arr) => (
                          <div key={svc.id} className={`flex items-center px-4 py-3.5 gap-3 ${i < arr.length - 1 ? "border-b border-black/[0.05]" : ""}`}>
                            <div className="flex-1 min-w-0">
                              {editingName[svc.id] !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <input value={editingName[svc.id]} onChange={e => setEditingName(p => ({ ...p, [svc.id]: e.target.value }))} className="field !py-1.5 text-[13px]" autoFocus />
                                  <button onClick={() => handleSaveName(svc.id)} className="text-[var(--color-accent-dark)] font-700 text-sm px-2 bg-[var(--color-accent)] rounded-full py-1">✓</button>
                                </div>
                              ) : (
                                <p className="text-[13px] font-600 truncate cursor-pointer" onClick={() => setEditingName(p => ({ ...p, [svc.id]: svc.name }))}>{svc.name}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {editingPrice[svc.id] !== undefined ? (
                                <>
                                  <input type="number" value={editingPrice[svc.id]} onChange={e => setEditingPrice(p => ({ ...p, [svc.id]: e.target.value }))} className="field !w-20 !py-1.5 text-right text-[13px]" autoFocus />
                                  <button onClick={() => handleSavePrice(svc.id)} className="text-[var(--color-accent-dark)] font-700 text-sm px-2 bg-[var(--color-accent)] rounded-full py-1">✓</button>
                                </>
                              ) : (
                                <button onClick={() => setEditingPrice(p => ({ ...p, [svc.id]: String(svc.price) }))} className="text-[13px] font-700 text-black bg-black/[0.05] px-3 py-1.5 rounded-full">
                                  {svc.price.toLocaleString()}₽
                                </button>
                              )}
                              <button onClick={() => handleDelSvc(svc.id)} className="w-7 h-7 rounded-full bg-red-50 text-red-400 text-[11px] flex items-center justify-center">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CATEGORIES */}
            {tab === "categories" && (
              <div className="fade-up">
                <div className="card p-4 mb-4">
                  <p className="section-label mb-3">Добавить категорию</p>
                  <div className="flex gap-2">
                    <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Название" className="field flex-1" />
                    <input value={catIcon} onChange={e => setCatIcon(e.target.value)} placeholder="◆" className="field text-center" style={{width: '70px'}} />
                    <button onClick={handleAddCat} className="btn-sm px-4">+</button>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="card p-10 text-center">
                    <span className="text-4xl block mb-2">🗂</span>
                    <p className="text-black/30 text-sm font-500">Нет категорий</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    {categories.map((cat, i) => (
                      <div key={cat.id} className={`flex justify-between items-center px-5 py-4 ${i < categories.length - 1 ? "border-b border-black/[0.05]" : ""}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-xl">{cat.icon}</div>
                          <div>
                            <p className="text-[14px] font-700">{cat.name}</p>
                            <p className="text-[11px] text-black/30">{services.filter(s => s.category_id === cat.id).length} услуг</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelCat(cat.id)}
                          className="text-[12px] font-600 text-red-400 bg-red-50 px-3 py-1.5 rounded-full"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PORTFOLIO */}
            {tab === "portfolio" && (
              <div className="fade-up">
                <div className="card p-4 mb-4 space-y-3">
                  <p className="section-label">Добавить фото</p>
                  <label className="flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed border-black/10 cursor-pointer relative active:bg-black/[0.02]">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPortFile(e.target.files?.[0] || null)} />
                    <span className="text-3xl">📷</span>
                    <span className="text-[13px] font-600 text-black/40">
                      {portFile ? portFile.name : "Нажмите чтобы выбрать"}
                    </span>
                  </label>
                  <input value={portDesc} onChange={e => setPortDesc(e.target.value)} placeholder="Описание фото" className="field" />
                  <button onClick={handleAddPortfolio} disabled={!portFile} className="btn-book disabled:opacity-30">
                    Загрузить
                  </button>
                </div>

                {portfolio.length === 0 ? (
                  <div className="card p-10 text-center">
                    <span className="text-4xl block mb-2">🖼</span>
                    <p className="text-black/30 text-sm font-500">Нет фото</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {portfolio.map((item) => (
                      <div key={item.id} className="card overflow-hidden relative">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt={item.description} className="w-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center bg-[var(--color-surface-2)]">
                            <span className="text-3xl">💅</span>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-[11px] text-black/40 font-500">{item.description}</p>
                        </div>
                        <button
                          onClick={() => handleDelPortfolio(item.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-black/50 text-xs flex items-center justify-center shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
