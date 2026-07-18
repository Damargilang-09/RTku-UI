"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { feeTypesApi, type FeeTypePayload } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";
import type { BillingPeriod } from "@/src/types";

const EMPTY_FORM = {
  name: "",
  description: "",
  amount: "",
  billingPeriod: "monthly" as BillingPeriod,
  dueDay: "",
};

export default function TambahJenisIuranPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Nama jenis iuran wajib diisi");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }

    if (form.billingPeriod === "monthly") {
      const dueDay = Number(form.dueDay);

      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        setError("Tanggal jatuh tempo harus diisi dari tanggal 1 sampai 31");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      amount: Number(form.amount),
      billingPeriod: form.billingPeriod,
      ...(form.billingPeriod === "monthly"
        ? { dueDay: Number(form.dueDay) }
        : {}),
    };

    setSubmitting(true);
    try {
      await feeTypesApi.create(payload);
      router.push("/jenis-iuran");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menambahkan jenis iuran",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <Link
          href="/jenis-iuran"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-tertiary"
          aria-label="Kembali ke daftar jenis iuran"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Tambah Jenis Iuran
          </h1>
          <p className="text-sm text-text-secondary">
            Buat jenis iuran baru yang nantinya dapat digunakan saat membuat
            tagihan warga.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5 sm:p-6"
      >
        {error && (
          <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nama Jenis Iuran"
            placeholder="Contoh: Iuran Kebersihan"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            required
          />
          <Input
            label="Nominal"
            type="number"
            min="1"
            placeholder="Contoh: 50000"
            value={form.amount}
            onChange={(event) => updateForm("amount", event.target.value)}
            required
          />
        </div>

        <Textarea
          label="Deskripsi"
          placeholder="Jelaskan kegunaan iuran ini (opsional)"
          rows={4}
          value={form.description}
          onChange={(event) => updateForm("description", event.target.value)}
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Periode Penagihan
          <select
            value={form.billingPeriod}
            onChange={(event) =>
              updateForm("billingPeriod", event.target.value)
            }
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="monthly">Bulanan</option>
            <option value="once">Sekali Bayar</option>
          </select>
        </label>

        {form.billingPeriod === "monthly" && (
          <Input
            label="Tanggal Jatuh Tempo"
            type="number"
            min="1"
            max="31"
            placeholder="Contoh: 10"
            value={form.dueDay}
            onChange={(event) => updateForm("dueDay", event.target.value)}
            required
          />
        )}

        <div className="flex items-start gap-3 rounded-xl bg-info-bg px-4 py-3 text-sm text-info">
          <span className="material-symbols-outlined mt-0.5 text-base">
            info
          </span>
          <p>
            Untuk iuran bulanan, tanggal jatuh tempo disimpan pada jenis iuran.
            Untuk iuran sekali bayar, tanggal jatuh tempo dipilih saat generate
            tagihan warga.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Link href="/jenis-iuran" className="sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-base">save</span>
            Simpan Jenis Iuran
          </Button>
        </div>
      </form>
    </div>
  );
}
