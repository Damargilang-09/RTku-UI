"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";

const NAV_ITEMS = [
  { href: "/beranda", icon: "home", label: "Beranda" },
  { href: "/tagihan", icon: "payments", label: "Tagihan" },
  { href: "/transaksi", icon: "history", label: "Riwayat" },
  { href: "/laporan-keuangan", icon: "summarize", label: "Laporan" },
  { href: "/profil", icon: "person", label: "Profil" },
];

export function WargaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-surface-secondary">
      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur">
        <div className="flex items-center justify-around px-1 py-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors",
                  active ? "text-primary" : "text-text-muted hover:text-primary",
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
