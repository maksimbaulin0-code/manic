"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchServices, fetchSlots, createBooking, uploadFile } from "@/lib/api";
import { getTGUser } from "@/lib/tg";
import type { Service, Slot } from "@/lib/api";

type Step = "service" | "slot" | "details";

const STEP_LABELS: Record<Step, string> = {
  service: "Услуга",
  slot: "Время",
  details: "Детали",
};

const STEPS: Step[] = ["service", "slot", "details"];

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("service");

  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sel, setSel] = useState<Service | null>(null);
  const [selSlot, setSelSlot] = useState<Slot | null>(null);
  const [comment, setComment] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchServices()
      .then((svcs) => {
        setServices(svcs);
        if (preselected) {
          const found = svcs.find((s) => s.id === Number(preselected));
          if (found) {
            setSel(found);
            setStep("slot");
            fetchSlots().then(setSlots);
          }
        }
      })
      .catch(() => setErr("Не удалось загрузить услуги"))
      .finally(() => setLoading(false));
  }, [preselected]);

  useEffect(() => {
    if (sel && !preselected) {
      fetchSlots().then(setSlots).catch(() => setErr("Не удалось загрузить слоты"));
    }
  }, [sel]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const r = new FileReader();
    r.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    r.readAsDataURL(f);
  };

  const handleBook = async () => {
    if (!sel || !selSlot) return;
    setSubmitting(true);
    setErr("");
    try {
      let photoUrl = "";
      if (photoFile) {
        const res = await uploadFile(photoFile);
        photoUrl = res.url;
      }
      const user = await getTGUser();
      await createBooking({
        service_id: sel.id,
        slot_id: selSlot.id,
        user_id: user.id || "web",
        user_name: user.name || "Гость",
        comment: comment.trim(),
        photo_wish: photoUrl,
      });
      setDone(true);
    } catch (e: any) {
      setErr("Ошибка записи: " + (e.message || ""));
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="px-5 pt-16 pb-28 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--color-accent)] flex items-center justify-center mb-6 shadow-lg">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-[24px] font-800 tracking-tight mb-1">Запись оформлена!</h2>
        <p className="text-[14px] text-black/40 mb-8">Ждём вас в студии</p>

        <div className="card w-full p-5 mb-8 text-left">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[15px] font-700">{sel?.name}</p>
              <p className="text-[13px] text-black/40 mt-0.5">{selSlot?.date} в {selSlot?.time}</p>
            </div>
            <span className="text-[18px] font-800">{sel?.price.toLocaleString()}₽</span>
          </div>
          {photoPreview && (
            <img src={photoPreview} alt="Референс" className="mt-3 w-full h-36 object-cover rounded-xl" />
          )}
        </div>

        <button onClick={() => router.push("/")} className="btn-book">
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* HEADER */}
      <div className="bg-white px-5 pt-10 pb-6 rounded-b-[32px] shadow-sm mb-5">
        <h1 className="text-[28px] font-800 tracking-tight mb-4">Запись</h1>

        {/* STEP PROGRESS */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const currentIdx = STEPS.indexOf(step);
            const isDone = currentIdx > i;
            const isCurrent = step === s;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-700 transition-all duration-300 ${
                      isCurrent
                        ? "bg-[var(--color-accent)] text-black shadow-md"
                        : isDone
                        ? "bg-black text-white"
                        : "bg-black/10 text-black/30"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span className={`text-[10px] font-600 mt-1.5 ${isCurrent ? "text-black" : "text-black/30"}`}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-10 h-0.5 mx-1 mb-4 transition-colors duration-300 ${
                      currentIdx > i ? "bg-black" : "bg-black/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5">
        {err && (
          <div className="card p-4 mb-5 border-2 border-red-200 bg-red-50">
            <p className="text-red-500 text-[13px] font-500">{err}</p>
          </div>
        )}

        {loading ? (
          <div className="card overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 border-b border-black/[0.05] animate-pulse last:border-0" />
            ))}
          </div>
        ) : (
          <>
            {/* STEP 1: SERVICE */}
            {step === "service" && (
              <div className="fade-up">
                <p className="section-label mb-3">Выберите услугу</p>
                <div className="card overflow-hidden">
                  {services.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-black/25 text-sm">Услуги не добавлены</p>
                    </div>
                  ) : (
                    services.map((svc, i, arr) => (
                      <button
                        key={svc.id}
                        onClick={() => { setSel(svc); setStep("slot"); setErr(""); }}
                        className={`w-full flex justify-between items-center px-5 py-4 text-left active:bg-[var(--color-surface-2)] transition-colors ${
                          i < arr.length - 1 ? "border-b border-black/[0.05]" : ""
                        }`}
                      >
                        <div>
                          <p className="text-[14px] font-600 text-black">{svc.name}</p>
                          <p className="text-[11px] text-black/30 mt-0.5">{svc.category_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-700">{svc.price.toLocaleString()}₽</span>
                          <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center">
                            <span className="text-[12px] text-black/40">›</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: SLOT */}
            {step === "slot" && (
              <div className="fade-up">
                <button
                  onClick={() => setStep("service")}
                  className="flex items-center gap-1.5 text-[13px] font-600 text-black/40 mb-4"
                >
                  ← Назад
                </button>

                {sel && (
                  <div className="card p-4 mb-5 border-2 border-[var(--color-accent)]">
                    <div className="flex justify-between items-center">
                      <p className="text-[14px] font-600">{sel.name}</p>
                      <span className="chip">{sel.price.toLocaleString()}₽</span>
                    </div>
                  </div>
                )}

                <p className="section-label mb-3">Свободное время</p>

                {slots.length === 0 ? (
                  <div className="card p-10 text-center">
                    <span className="text-4xl block mb-3">📅</span>
                    <p className="text-[14px] font-600 text-black/40">Нет свободных слотов</p>
                    <p className="text-[12px] text-black/25 mt-1">Загляните позже</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    {slots.map((slot, i, arr) => (
                      <button
                        key={slot.id}
                        onClick={() => { setSelSlot(slot); setStep("details"); setErr(""); }}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left active:bg-[var(--color-surface-2)] transition-colors ${
                          i < arr.length - 1 ? "border-b border-black/[0.05]" : ""
                        }`}
                      >
                        <span className="status-free" />
                        <div className="flex-1">
                          <p className="text-[14px] font-600 text-black">{slot.date}</p>
                          <p className="text-[12px] text-black/35 mt-0.5">{slot.time}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                          <span className="text-sm font-700">›</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: DETAILS */}
            {step === "details" && (
              <div className="fade-up">
                <button
                  onClick={() => setStep("slot")}
                  className="flex items-center gap-1.5 text-[13px] font-600 text-black/40 mb-4"
                >
                  ← Назад
                </button>

                {/* Summary card */}
                <div className="card p-5 mb-6 border-2 border-[var(--color-accent)]">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[15px] font-700">{sel?.name}</p>
                    <span className="chip">{sel?.price.toLocaleString()}₽</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-free" />
                    <p className="text-[13px] text-black/40">{selSlot?.date} в {selSlot?.time}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="section-label mb-2">Пожелания</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Опишите желаемый дизайн..."
                      rows={3}
                      className="field"
                    />
                  </div>

                  <div>
                    <p className="section-label mb-2">Фото-референс</p>
                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden">
                        <img
                          src={photoPreview}
                          alt=""
                          className="w-full h-44 object-cover"
                        />
                        <button
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="card p-8 flex flex-col items-center cursor-pointer active:bg-[var(--color-surface-2)] border-2 border-dashed border-black/10">
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                        <span className="text-3xl mb-2">📎</span>
                        <span className="text-[13px] font-600 text-black/40">Прикрепить фото</span>
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={submitting}
                    className="btn-book disabled:opacity-50"
                  >
                    {submitting ? "Оформляем..." : "Подтвердить запись"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-28">
          <div className="bg-white px-5 pt-10 pb-6 rounded-b-[32px] shadow-sm mb-5">
            <div className="h-8 w-32 bg-black/[0.05] rounded-xl animate-pulse mb-4" />
            <div className="h-4 w-24 bg-black/[0.04] rounded animate-pulse" />
          </div>
          <div className="px-5">
            <div className="card overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 border-b border-black/[0.05] animate-pulse last:border-0" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
