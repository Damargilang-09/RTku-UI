"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { feeTypesApi, type FeeTypePayload } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import type { BillingPeriod } from "@/src/types";

const EMPTY_FORM = {
  name: "",
  description: "",
  amount: "",
  dueDay: "",
  billingPeriod: "monthly" as BillingPeriod,
};

export default function EditJenisIuranPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await feeTypesApi.getDetail(params.id);
      const feeType = response.data;
      setForm({
        name: feeType.name,
        description: feeType.description ?? "",
        amount: String(feeType.amount),
        dueDay: feeType.dueDay ? String(feeType.dueDay) : "",
        billingPeriod: feeType.billingPeriod,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil detail jenis iuran");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Nama jenis iuran wajib diisi");
    if (!form.amount || Number(form.amount) <= 0) return setError("Nominal harus lebih dari 0");
    if (form.billingPeriod === "monthly" && form.dueDay && (Number(form.dueDay) < 1 || Number(form.dueDay) > 31)) {
      return setError("Tanggal jatuh tempo harus berada di antara 1 sampai 31");
    }

    const payload: Partial<FeeTypePayload> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      amount: Number(form.amount),
      billingPeriod: form.billingPeriod,
      dueDay: form.billingPeriod === "monthly" && form.dueDay ? Number(form.dueDay) : undefined,
    };

    setSubmitting(true);
    try {
      await feeTypesApi.update(params.id, payload);
      router.push(`/jenis-iuran/${params.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui jenis iuran");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <Link href={`/jenis-iuran/${params.id}`} className="rounded-lg p-2 text-text-secondary hover:bg-surface-tertiary" aria-label="Kembali">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Edit Jenis Iuran</h1>
          <p className="text-sm text-text-secondary">Perbarui informasi jenis iuran.</p>
        </div>
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nama Jenis Iuran" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
          <Input label="Nominal" type="number" min="1" value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} required />
        </div>

        <Textarea label="Deskripsi" rows={4} value={form.description} onChange={(event) => updateForm("description", event.target.value)} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
            Periode Penagihan
            <select
              value={form.billingPeriod}
              onChange={(event) => updateForm("billingPeriod", event.target.value)}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="monthly">Bulanan</option>
              <option value="once">Sekali Bayar</option>
            </select>
          </label>

          <Input
            label="Tanggal Jatuh Tempo"
            type="number"
            min="1"
            max="31"
            value={form.dueDay}
            onChange={(event) => updateForm("dueDay", event.target.value)}
            disabled={form.billingPeriod === "once"}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href={`/jenis-iuran/${params.id}`}>
            <Button type="button" variant="secondary">Batal</Button>
          </Link>
          <Button type="submit" loading={submitting}>
            <span className="material-symbols-outlined text-base">save</span>
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
