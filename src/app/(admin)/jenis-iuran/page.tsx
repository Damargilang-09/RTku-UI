"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { feeTypesApi, type FeeTypePayload } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatRupiah } from "@/src/lib/utils";
import type { BillingPeriod, FeeType } from "@/src/types";

const PAGE_SIZE = 6;

const EMPTY_FORM = {
  name: "",
  description: "",
  amount: "",
  dueDay: "",
  billingPeriod: "monthly" as BillingPeriod,
};

function getVisiblePages(currentPage: number, totalPage: number) {
  if (totalPage <= 5) {
    return Array.from({ length: totalPage }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPage, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages].filter((page) => page >= 1 && page <= totalPage).sort((a, b) => a - b);
}

export default function JenisIuranPage() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"all" | BillingPeriod>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeeType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await feeTypesApi.getAll();
      setFeeTypes(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil data jenis iuran");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredFeeTypes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return feeTypes.filter((feeType) => {
      const matchesSearch =
        !keyword ||
        feeType.name.toLowerCase().includes(keyword) ||
        feeType.description?.toLowerCase().includes(keyword);
      const matchesPeriod = periodFilter === "all" || feeType.billingPeriod === periodFilter;

      return matchesSearch && matchesPeriod;
    });
  }, [feeTypes, periodFilter, search]);

  const totalPage = Math.max(1, Math.ceil(filteredFeeTypes.length / PAGE_SIZE));
  const visiblePages = getVisiblePages(page, totalPage);
  const paginatedFeeTypes = filteredFeeTypes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, periodFilter]);

  useEffect(() => {
    if (page > totalPage) setPage(totalPage);
  }, [page, totalPage]);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  function openEditForm(feeType: FeeType) {
    setEditing(feeType);
    setForm({
      name: feeType.name,
      description: feeType.description ?? "",
      amount: String(feeType.amount),
      dueDay: feeType.dueDay ? String(feeType.dueDay) : "",
      billingPeriod: feeType.billingPeriod,
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError("Nama jenis iuran wajib diisi");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }

    if (form.billingPeriod === "monthly" && form.dueDay && (Number(form.dueDay) < 1 || Number(form.dueDay) > 31)) {
      setError("Tanggal jatuh tempo harus berada di antara 1 sampai 31");
      return;
    }

    const payload: FeeTypePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      amount: Number(form.amount),
      billingPeriod: form.billingPeriod,
      dueDay:
        form.billingPeriod === "monthly" && form.dueDay
          ? Number(form.dueDay)
          : undefined,
    };

    setSubmitting(true);
    try {
      if (editing) {
        await feeTypesApi.update(editing.id, payload);
        setSuccess("Jenis iuran berhasil diperbarui");
      } else {
        await feeTypesApi.create(payload);
        setSuccess("Jenis iuran berhasil ditambahkan");
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan jenis iuran");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(feeType: FeeType) {
    const confirmed = window.confirm(
      `Hapus jenis iuran “${feeType.name}”? Data akan dinonaktifkan dan tidak lagi muncul dalam daftar.`,
    );
    if (!confirmed) return;

    setBusyId(feeType.id);
    setError(null);
    setSuccess(null);
    try {
      await feeTypesApi.delete(feeType.id);
      setSuccess("Jenis iuran berhasil dihapus");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus jenis iuran");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Kelola Jenis Iuran</h1>
          <p className="text-sm text-text-secondary">
            Tambah dan kelola jenis iuran yang digunakan untuk membuat tagihan warga.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <span className="material-symbols-outlined text-base">add</span>
          Tambah Jenis Iuran
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                {editing ? "Edit Jenis Iuran" : "Tambah Jenis Iuran"}
              </h2>
              <p className="text-xs text-text-secondary">Lengkapi informasi jenis iuran di bawah ini.</p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-tertiary"
              aria-label="Tutup formulir"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

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
            rows={3}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
          />

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
              placeholder="Contoh: 10"
              value={form.dueDay}
              onChange={(event) => updateForm("dueDay", event.target.value)}
              disabled={form.billingPeriod === "once"}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              <span className="material-symbols-outlined text-base">save</span>
              {editing ? "Simpan Perubahan" : "Simpan Jenis Iuran"}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          placeholder="Cari nama atau deskripsi iuran..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Periode
          <select
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value as "all" | BillingPeriod)}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Semua periode</option>
            <option value="monthly">Bulanan</option>
            <option value="once">Sekali Bayar</option>
          </select>
        </label>
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}
      {success && <div className="rounded-xl bg-success-bg px-4 py-3 text-sm text-success">{success}</div>}

      {loading ? (
        <Spinner />
      ) : paginatedFeeTypes.length === 0 ? (
        <EmptyState icon="receipt_long" title="Tidak ada jenis iuran ditemukan" />
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {paginatedFeeTypes.map((feeType, index) => (
              <div
                key={feeType.id}
                className={`flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  index !== paginatedFeeTypes.length - 1 ? "border-b border-surface-tertiary" : ""
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary">{feeType.name}</p>
                      <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-semibold text-info">
                        {feeType.billingPeriod === "monthly" ? "Bulanan" : "Sekali Bayar"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">{formatRupiah(feeType.amount)}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {feeType.description || "Tanpa deskripsi"}
                      {feeType.billingPeriod === "monthly" && (
                        <> &middot; Jatuh tempo tanggal {feeType.dueDay ?? "-"}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <Button
                    variant="secondary"
                    className="px-3 py-2 text-xs"
                    onClick={() => openEditForm(feeType)}
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-2 text-xs"
                    loading={busyId === feeType.id}
                    onClick={() => handleDelete(feeType)}
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredFeeTypes.length)} dari {filteredFeeTypes.length} jenis iuran
            </p>

            {totalPage > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-2 text-xs"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                  Sebelumnya
                </Button>

                {visiblePages.map((pageNumber, index) => {
                  const previousPage = visiblePages[index - 1];
                  return (
                    <div key={pageNumber} className="flex items-center gap-2">
                      {previousPage && pageNumber - previousPage > 1 && (
                        <span className="px-1 text-sm text-text-muted">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition-colors ${
                          page === pageNumber
                            ? "bg-primary text-white"
                            : "bg-surface text-text-secondary hover:bg-surface-tertiary"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    </div>
                  );
                })}

                <Button
                  variant="secondary"
                  className="px-3 py-2 text-xs"
                  disabled={page === totalPage}
                  onClick={() => setPage((current) => Math.min(totalPage, current + 1))}
                >
                  Berikutnya
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
