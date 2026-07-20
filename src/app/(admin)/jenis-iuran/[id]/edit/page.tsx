"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { feeTypesApi } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import type { BillingPeriod } from "@/src/types";
import {
  feeTypeFormSchema,
  type FeeTypeFormValues,
} from "@/src/validations";

const EMPTY_FORM = {
  name: "",
  description: "",
  amount: "",
  billingPeriod: "monthly" as BillingPeriod,
  dueDay: "",
};

type FormState = typeof EMPTY_FORM;

export default function EditJenisIuranPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FeeTypeFormValues, string>>
  >({});

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
        billingPeriod: feeType.billingPeriod,
        dueDay: feeType.dueDay === null ? "" : String(feeType.dueDay),
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal mengambil detail jenis iuran",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    if (fieldErrors[key as keyof FeeTypeFormValues]) {
      setFieldErrors((current) => ({
        ...current,
        [key as keyof FeeTypeFormValues]: undefined,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = feeTypeFormSchema.safeParse({
      name: form.name,
      description: form.description.trim() ? form.description : undefined,
      amount: form.amount,
      billingPeriod: form.billingPeriod,
      dueDay: form.billingPeriod === "monthly" ? form.dueDay : undefined,
    });

    if (!parsed.success) {
      const nextFieldErrors: Partial<Record<keyof FeeTypeFormValues, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FeeTypeFormValues;
        if (key && !nextFieldErrors[key]) {
          nextFieldErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      return;
    }

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description,
      amount: parsed.data.amount,
      billingPeriod: parsed.data.billingPeriod,
      ...(parsed.data.billingPeriod === "monthly"
        ? { dueDay: Number(parsed.data.dueDay) }
        : {}),
    };

    setSubmitting(true);
    try {
      const response = await feeTypesApi.update(params.id, payload);
      router.push(`/jenis-iuran/${response.data.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memperbarui jenis iuran",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <Link
          href={`/jenis-iuran/${params.id}`}
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-tertiary"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Edit Jenis Iuran
          </h1>
          <p className="text-sm text-text-secondary">
            Perbarui informasi jenis iuran yang dipilih.
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
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            error={fieldErrors.name}
            required
          />
          <Input
            label="Nominal"
            type="number"
            min="1"
            value={form.amount}
            onChange={(event) => updateForm("amount", event.target.value)}
            error={fieldErrors.amount}
            required
          />
        </div>

        <Textarea
          label="Deskripsi"
          rows={4}
          value={form.description}
          onChange={(event) => updateForm("description", event.target.value)}
          error={fieldErrors.description}
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
            error={fieldErrors.dueDay}
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
          <Link href={`/jenis-iuran/${params.id}`}>
            <Button type="button" variant="secondary">
              Batal
            </Button>
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
