"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/lib/auth-store";
import { authApi } from "@/src/lib/api/auth";
import { ROLE_LABEL } from "@/src/lib/utils";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: "dashboard",
    label: "Dashboard",
    roles: ["bendahara", "ketuaRT"],
  },

  {
    href: "/jenis-iuran",
    icon: "price_change",
    label: "Jenis Iuran",
    roles: ["bendahara"],
  },
  {
    href: "/tagihan-warga",
    icon: "request_quote",
    label: "Tagihan Warga",
    roles: ["bendahara"],
  },
  {
    href: "/konfirmasi-pembayaran",
    icon: "fact_check",
    label: "Konfirmasi Pembayaran",
    roles: ["bendahara", "ketuaRT"],
  },
  {
    href: "/pengeluaran",
    icon: "receipt_long",
    label: "Pengeluaran",
    roles: ["bendahara", "ketuaRT"],
  },
  {
    href: "/pemasukan",
    icon: "trending_up",
    label: "Pemasukan Lain",
    roles: ["bendahara", "ketuaRT"],
  },
  { href: "/warga", icon: "group", label: "Kelola Warga", roles: ["ketuaRT"] },
  {
    href: "/kelola-ketua-rt",
    icon: "manage_accounts",
    label: "Kelola Ketua RT",
    roles: ["superAdmin"],
  },
  {
    href: "/laporan",
    icon: "summarize",
    label: "Laporan Keuangan",
    roles: ["bendahara", "ketuaRT"],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const items = NAV_ITEMS.filter(
    (item) => !user || item.roles.includes(user.role),
  );

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      <aside className="hidden w-64 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
          <span className="text-lg font-bold text-text-primary">RTku</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
                )}
              >
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tertiary text-sm font-semibold text-text-primary">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
                {user?.name}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {user ? ROLE_LABEL[user.role] : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-bg"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1">
        {/* Topbar mobile */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <span className="text-lg font-bold text-primary">RTku</span>
          <button onClick={handleLogout} className="text-text-secondary">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
