"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/lib/api/auth";
import { Spinner } from "@/src/components/ui/Spinner";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    authApi
      .me()
      .then((res) => {
        if (res.data.role === "warga") {
          router.replace("/beranda");
          return;
        }

        if (res.data.role === "superAdmin") {
          router.replace("/kelola-ketua-rt");
          return;
        }

        router.replace("/dashboard");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
      <Spinner />
    </div>
  );
}
