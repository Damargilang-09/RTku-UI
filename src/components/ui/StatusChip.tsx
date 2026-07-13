import { cn } from "@/src/lib/utils";
import { STATUS_LABEL } from "@/src/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-success-bg text-success",
  approved: "bg-success-bg text-success",
  closed: "bg-success-bg text-success",
  pending: "bg-warning-bg text-warning",
  unpaid: "bg-warning-bg text-warning",
  open: "bg-info-bg text-info",
  overdue: "bg-danger-bg text-danger",
  rejected: "bg-danger-bg text-danger",
  failed: "bg-danger-bg text-danger",
  cancelled: "bg-surface-tertiary text-text-secondary",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_STYLE[status] ?? "bg-surface-tertiary text-text-secondary",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
