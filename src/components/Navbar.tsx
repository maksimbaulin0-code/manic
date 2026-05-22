"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isTGAdmin } from "@/lib/tg";

const NAV = [
  { href: "/", label: "Главная", icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#111" : "none"} stroke={active ? "#111" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    </svg>
  )},
  { href: "/services", label: "Прайс", icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#111" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4"/>
      <line x1="8" y1="9" x2="16" y2="9"/>
      <line x1="8" y1="13" x2="14" y2="13"/>
      <line x1="8" y1="17" x2="11" y2="17"/>
    </svg>
  )},
  { href: "/portfolio", label: "Работы", icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#111" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )},
];

export default function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    isTGAdmin().then(setIsAdmin);
  }, []);

  const adminItem = {
    href: "/admin",
    label: "Мастер",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#111" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    )
  };

  const items = isAdmin ? [...NAV, adminItem] : NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 navbar">
      <div className="flex justify-around items-center px-2 max-w-lg mx-auto h-full pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 py-2 px-3 min-w-[60px] transition-all duration-150"
            >
              <div className={`transition-transform duration-150 ${active ? "scale-110" : "scale-100"}`}>
                {item.icon(active)}
              </div>
              <span className={`text-[10px] font-600 tracking-wide transition-colors ${active ? "text-[#111] font-bold" : "text-[#aaa]"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
