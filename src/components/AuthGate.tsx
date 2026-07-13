"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/lib/auth-store";
import { authApi } from "@/src/lib/api/auth";
import { Spinner } from "@/src/components/ui/Spinner";
import type { UserRole } from "@/src/types";

export function AuthGate({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await authApi.me();
        if (!active) return;
        setUser(res.data);
        if (!allowedRoles.includes(res.data.role)) {
          router.replace(res.data.role === "warga" ? "/beranda" : "/dashboard");
          return;
        }
      } catch {
        if (!active) return;
        setLoading(false);
        router.replace("/login");
        return;
      } finally {
        if (active) setChecked(true);
      }
    }
    check();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
