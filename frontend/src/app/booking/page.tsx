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
      <div className="px-5 pt-10 pb-24 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <span className="text-lg">✓</span>
        </div>
        <h2 className="text-[18px] font-light mb-2">Запись оформлена</h2>
        <div className="space-y-1 mt-6">
          <p className="text-[13px] text-white/50">{sel?.name}</p>
          <p className="text-[13px] text-white/50">
            {selSlot?.date} в {selSlot?.time}
          </p>
          <p className="text-[14px] font-medium mt-3">{sel?.price.toLocaleString()}₽</p>
          {photoPreview && (
            <img src={photoPreview} alt="Референс" className="mt-4 w-32 h-32 object-cover rounded-xl mx-auto" />
          )}
        </div>
        <button
          onClick={() => router.push("/")}
          className="btn-book mt-10 max-w-[220px] mx-auto"
        >
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="text-[20px] font-light tracking-wide mb-2">Запись</h1>

      {/* PROGRESS */}
      <div className="flex items-center gap-0 mt-6 mb-8">
        {(Object.keys(STEP_LABELS) as Step[]).map((s, i, arr) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${
                  step === s
                    ? "bg-white text-black"
                    : arr.indexOf(step) > i
                    ? "bg-white/10 text-white/50"
                    : "bg-white/5 text-white/20"
                }`}
              >
                {arr.indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span
                className={`text-[9px] mt-1.5 ${
                  step === s ? "text-white/50" : "text-white/15"
                }`}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div
                className={`w-8 h-px mx-1 mb-4 ${
                  arr.indexOf(step) > i ? "bg-white/15" : "bg-white/[0.04]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {err && (
        <div className="card p-4 mb-6 border-red-400/20">
          <p className="text-red-400/60 text-sm">{err}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/[0.02] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* STEP 1 */}
          {step === "service" && (
            <div>
              <p className="text-[11px] tracking-[0.12em] uppercase text-white/20 mb-4">
                Выберите услугу
              </p>
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => {
                    setSel(svc);
                    setStep("slot");
                    setErr("");
                  }}
                  className="w-full flex justify-between items-center py-4 border-b border-white/[0.03] text-left"
                >
                  <span className="text-[14px]">{svc.name}</span>
                  <span className="price text-white/40">{svc.price.toLocaleString()}₽</span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 */}
          {step === "slot" && (
            <div>
              <button
                onClick={() => setStep("service")}
                className="text-white/25 text-sm mb-6 flex items-center gap-1"
              >
                ← Назад
              </button>

              {sel && (
                <div className="card card-selected p-4 mb-6 flex justify-between items-center">
                  <span className="text-[13px]">{sel.name}</span>
                  <span className="price">{sel.price.toLocaleString()}₽</span>
                </div>
              )}

              <p className="text-[11px] tracking-[0.12em] uppercase text-white/20 mb-4">
                Свободные окошки
              </p>
              {slots.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                    <span className="text-white/20">📅</span>
                  </div>
                  <p className="text-white/20 text-sm">Нет свободных слотов</p>
                  <p className="text-white/15 text-xs mt-1">
                    Загляните позже
                  </p>
                </div>
              ) : (
                <div>
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSelSlot(slot);
                        setStep("details");
                        setErr("");
                      }}
                      className="w-full flex items-center gap-3 py-4 border-b border-white/[0.03] text-left"
                    >
                      <span className="status-free" />
                      <div className="flex-1">
                        <p className="text-[14px]">{slot.date}</p>
                        <p className="text-[12px] text-white/25">{slot.time}</p>
                      </div>
                      <span className="text-white/10 text-xs">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === "details" && (
            <div>
              <button
                onClick={() => setStep("slot")}
                className="text-white/25 text-sm mb-6 flex items-center gap-1"
              >
                ← Назад
              </button>

              <div className="card card-selected p-5 mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[14px]">{sel?.name}</span>
                  <span className="price">{sel?.price.toLocaleString()}₽</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-free" />
                  <span className="text-[12px] text-white/30">
                    {selSlot?.date} в {selSlot?.time}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-[11px] tracking-[0.12em] uppercase text-white/20 mb-2">
                    Пожелания
                  </p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Опишите желаемый дизайн..."
                    rows={3}
                    className="field"
                  />
                </div>

                <div>
                  <p className="text-[11px] tracking-[0.12em] uppercase text-white/20 mb-2">
                    Фото-референс
                  </p>
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt=""
                        className="w-full h-44 object-cover rounded-xl border border-white/[0.04]"
                      />
                      <button
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white/60 text-sm flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="card p-8 flex flex-col items-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhoto}
                      />
                      <span className="text-white/15 text-sm">Прикрепить фото</span>
                    </label>
                  )}
                </div>

                <button
                  onClick={handleBook}
                  disabled={submitting}
                  className="btn-book mt-6"
                >
                  {submitting ? "Оформляем..." : "Записаться"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 pt-6 pb-24">
          <div className="h-6 w-24 bg-white/[0.02] rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/[0.02] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
