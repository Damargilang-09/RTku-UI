import { AuthGate } from "@/src/components/AuthGate";
import { WargaShell } from "@/src/components/layout/WargaShell";

export default function WargaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate allowedRoles={["warga"]}>
      <WargaShell>{children}</WargaShell>
    </AuthGate>
  );
}
