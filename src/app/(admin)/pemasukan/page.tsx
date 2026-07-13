"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { incomeApi } from "@/src/lib/api/income";
import { ApiError } from "@/src/lib/api/axios";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { cn, formatRupiah, formatDate } from "@/src/lib/utils";
import type { ApprovalStatus, Income } from "@/src/types";

const TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

function generateIncomeCode() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `INC-${date}-${Math.floor(Math.random() * 900 + 100)}`;
}

export default function PemasukanPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    income_code: generateIncomeCode(),
    title: "",
    description: "",
    amount: "",
    income_date: new Date().toISOString().slice(0, 10),
  });
  const [reason, setReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    incomeApi
      .getAll({ status: tab, limit: 50 })
      .then((res) => setIncome(res.data.formattedIncome))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await incomeApi.create({
        income_code: form.income_code,
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        income_date: form.income_date,
      });
      setShowForm(false);
      setForm({ income_code: generateIncomeCode(), title: "", description: "", amount: "", income_date: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan pemasukan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await incomeApi.approve(id, { status: "approved" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyetujui pemasukan");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi");
      return;
    }
    setBusyId(id);
    try {
      await incomeApi.approve(id, { status: "rejected", rejected_reason: reason.trim() });
      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menolak pemasukan");
    } finally {
      setBusyId(null);
    }
  }

  const canApprove = user?.role === "ketuaRT";
  const canCreate = user?.role === "bendahara";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pemasukan Lain</h1>
          <p className="text-sm text-text-secondary">Sumbangan, donasi, dan pemasukan di luar iuran warga.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <span className="material-symbols-outlined text-base">add</span>
            Catat Pemasukan
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6">
          <Input label="Kode Pemasukan" value={form.income_code} onChange={(e) => update("income_code", e.target.value)} required />
          <Input label="Judul" placeholder="Contoh: Donasi Fogging" value={form.title} onChange={(e) => update("title", e.target.value)} required />
          <Textarea label="Deskripsi" value={form.description} onChange={(e) => update("description", e.target.value)} required rows={2} />
          <Input label="Jumlah (Rp)" type="number" min={1} value={form.amount} onChange={(e) => update("amount", e.target.value)} required />
          <Input label="Tanggal" type="date" value={form.income_date} onChange={(e) => update("income_date", e.target.value)} required />
          <div className="flex gap-2">
            <Button type="submit" loading={submitting}>Simpan</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Batal</Button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.value ? "bg-primary text-white" : "bg-surface-tertiary text-text-secondary hover:bg-border",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <Spinner />
      ) : income?.length === 0 ? (
        <EmptyState icon="trending_up" title="Tidak ada data" description="Belum ada pemasukan pada status ini." />
      ) : (
        <div className="flex flex-col gap-3">
          {income?.map((inc) => (
            <Card key={inc.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{inc.title}</p>
                  <p className="text-xs text-text-secondary">{inc.income_code} &middot; {formatDate(inc.income_date)}</p>
                  {inc.description && <p className="mt-1 text-xs text-text-muted">{inc.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-secondary-dark">{formatRupiah(inc.amount)}</span>
                  <StatusChip status={inc.status} />
                </div>
              </div>

              {canApprove && inc.status === "pending" && (
                <div className="mt-4 flex flex-col gap-3">
                  {rejectingId === inc.id ? (
                    <>
                      <Textarea placeholder="Alasan penolakan" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button variant="danger" loading={busyId === inc.id} onClick={() => handleReject(inc.id)}>Kirim Penolakan</Button>
                        <Button variant="secondary" onClick={() => { setRejectingId(null); setReason(""); }}>Batal</Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="success" loading={busyId === inc.id} onClick={() => handleApprove(inc.id)}>
                        <span className="material-symbols-outlined text-base">check</span>Setujui
                      </Button>
                      <Button variant="danger" onClick={() => setRejectingId(inc.id)}>
                        <span className="material-symbols-outlined text-base">close</span>Tolak
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {inc.status === "rejected" && inc.rejected_reason && (
                <p className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">Alasan: {inc.rejected_reason}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
