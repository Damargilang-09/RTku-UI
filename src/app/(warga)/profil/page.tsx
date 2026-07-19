"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/lib/auth-store";
import { authApi } from "@/src/lib/api/auth";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { ROLE_LABEL } from "@/src/lib/utils";

const FIELDS: {
  key: "email" | "houseNumber" | "address";
  label: string;
  icon: string;
}[] = [
  { key: "email", label: "Email", icon: "mail" },
  { key: "houseNumber", label: "Nomor Blok Rumah", icon: "home" },
  { key: "address", label: "Alamat", icon: "location_on" },
];

export default function ProfilPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <h1 className="text-xl font-bold text-text-primary">Profil</h1>

      <Card className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-xl font-bold text-primary">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <p className="text-base font-semibold text-text-primary">{user.name}</p>
        <p className="text-xs text-text-secondary">
          {ROLE_LABEL[user.role] ?? user.role}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            user.status === "active"
              ? "bg-success-bg text-success"
              : "bg-surface-tertiary text-text-secondary"
          }`}
        >
          {user.status === "active" ? "Akun Aktif" : "Akun Nonaktif"}
        </span>
      </Card>

      <Card className="divide-y divide-surface-tertiary p-0">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-3 px-4 py-3.5">
            <span className="material-symbols-outlined text-text-muted">
              {field.icon}
            </span>
            <div>
              <p className="text-xs text-text-secondary">{field.label}</p>
              <p className="text-sm font-medium text-text-primary">
                {user[field.key] ?? "-"}
              </p>
            </div>
          </div>
        ))}
      </Card>

      <Button
        variant="secondary"
        fullWidth
        onClick={handleLogout}
        className="text-danger"
      >
        <span className="material-symbols-outlined text-base">logout</span>
        Keluar
      </Button>
    </div>
  );
}
