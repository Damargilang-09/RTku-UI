import { AuthGate } from "@/src/components/AuthGate";
import { AdminShell } from "@/src/components/layout/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate allowedRoles={["bendahara", "ketuaRT", "superAdmin"]}>
      <AdminShell>{children}</AdminShell>
    </AuthGate>
  );
}
