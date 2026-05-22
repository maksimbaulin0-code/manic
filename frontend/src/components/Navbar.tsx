"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isTGAdmin } from "@/lib/tg";

const NAV = [
  { href: "/", label: "Главная", icon: "◐" },
  { href: "/services", label: "Прайс", icon: "◈" },
  { href: "/portfolio", label: "Работы", icon: "◉" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    isTGAdmin().then(setIsAdmin);
  }, []);

  const items = isAdmin
    ? [...NAV, { href: "/admin", label: "Мастер", icon: "⚙" }]
    : NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 navbar">
      <div className="flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom)] max-w-lg mx-auto h-full">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 px-2 min-w-[64px] transition-all duration-150 ${
                active ? "text-white" : "text-white/35"
              }`}
            >
              <span className={`text-xl mb-1 transition-transform ${active ? "scale-110" : "scale-100"}`}>
                {item.icon}
              </span>
              <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
