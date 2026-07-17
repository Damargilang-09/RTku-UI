import { twMerge } from "tailwind-merge";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

export function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "-";
}

export const STATUS_LABEL: Record<string, string> = {
  unpaid: "Belum Dibayar",
  pending: "Menunggu Verifikasi",
  paid: "Lunas",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
  approved: "Disetujui",
  rejected: "Ditolak",
  open: "Berjalan",
  closed: "Ditutup",
  failed: "Gagal",
};

export const ROLE_LABEL: Record<string, string> = {
  warga: "Warga",
  bendahara: "Bendahara",
  ketuaRT: "Ketua RT",
  superAdmin: "Super Admin",
};
