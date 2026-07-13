"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { expensesApi } from "@/src/lib/api/expenses";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";

function generateExpenseCode() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 900 + 100);
  return `EXP-${date}-${rand}`;
}

export default function InputPengeluaranPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    expenseCode: generateExpenseCode(),
    title: "",
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 3);
    setFiles(selected);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("expenseCode", form.expenseCode);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("amount", form.amount);
      formData.append("expenseDate", form.expenseDate);
      files.forEach((file) => formData.append("EXPENSES_IMAGES", file));

      await expensesApi.create(formData);
      router.push("/pengeluaran");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan pengeluaran");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link href="/pengeluaran" className="text-text-secondary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Input Pengeluaran</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6">
        {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

        <Input label="Kode Pengeluaran" value={form.expenseCode} onChange={(e) => update("expenseCode", e.target.value)} required />
        <Input label="Judul Pengeluaran" placeholder="Contoh: Beli ATK Kantor" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        <Textarea label="Deskripsi" placeholder="Rincian penggunaan dana" value={form.description} onChange={(e) => update("description", e.target.value)} required rows={3} />
        <Input label="Jumlah (Rp)" type="number" min={1} placeholder="0" value={form.amount} onChange={(e) => update("amount", e.target.value)} required />
        <Input label="Tanggal Pengeluaran" type="date" value={form.expenseDate} onChange={(e) => update("expenseDate", e.target.value)} required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Bukti Pengeluaran (maks. 3 foto)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleFiles}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
          />
          {files.length > 0 && (
            <p className="text-xs text-text-secondary">{files.length} foto dipilih</p>
          )}
        </div>

        <Button type="submit" fullWidth loading={submitting} className="mt-2">
          Simpan Pengeluaran
        </Button>
      </form>
    </div>
  );
}
