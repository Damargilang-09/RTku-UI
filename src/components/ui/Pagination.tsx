"use client";

import { Button } from "@/src/components/ui/Button";

interface PaginationProps {
  page: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function Pagination({ page, hasNextPage, onPageChange, loading }: PaginationProps) {
  const hasPrevPage = page > 1;

  if (!hasPrevPage && !hasNextPage) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        type="button"
        variant="secondary"
        disabled={!hasPrevPage || loading}
        onClick={() => onPageChange(page - 1)}
      >
        <span className="material-symbols-outlined text-base">chevron_left</span>
        Sebelumnya
      </Button>

      <span className="min-w-[2.5rem] text-center text-sm font-medium text-text-secondary">
        Hal {page}
      </span>

      <Button
        type="button"
        variant="secondary"
        disabled={!hasNextPage || loading}
        onClick={() => onPageChange(page + 1)}
      >
        Selanjutnya
        <span className="material-symbols-outlined text-base">chevron_right</span>
      </Button>
    </div>
  );
}
