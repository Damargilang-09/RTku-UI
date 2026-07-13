// Enum yang sama persis dengan backend (generated/prisma)

export type UserRole = "warga" | "bendahara" | "ketuaRT" | "superAdmin";
export type UserStatus = "active" | "inactive";

export type BillStatus = "unpaid" | "pending" | "paid" | "overdue" | "cancelled";
export type ApprovalStatus = "approved" | "rejected" | "pending";
export type BillingPeriod = "monthly" | "once";

export interface User {
  id: string;
  name: string;
  email: string;
  houseNumber: string | null;
  address: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface FeeType {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  dueDay: number | null;
  billingPeriod: BillingPeriod;
}

export interface Bill {
  id: string;
  feeTypeId: string;
  userId: string;
  billCode: string;
  batchId: string | null;
  amount: number;
  periodYear: number | null;
  periodMonth: number | null;
  dueDate: string;
  status: BillStatus;
  paidAt: string | null;
  createdAt: string;
  feeType: { id: string; name: string; billingPeriod: BillingPeriod };
  user?: { id: string; name: string; email: string; houseNumber: string | null };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: string | null;
  paidAt: string;
  status: ApprovalStatus;
  rejectedReason: string | null;
  paymentProof?: string | null;
  payment_proof_img?: string | null;
  userName?: string;
  feeTypeName?: string;
  approvedBy?: string | null;
  billStatus?: BillStatus;
  createdAt?: string;
}

export interface Expense {
  id: string;
  expenseCode: string;
  title: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  status: ApprovalStatus;
  rejectedReason: string | null;
  approvedAt: string | null;
  requestedBy?: string;
  approvedBy?: string | null;
  images?: { id: string; attachment_url: string }[];
}

export interface Income {
  id: string;
  income_code: string;
  title: string;
  description: string | null;
  amount: number;
  income_date: string;
  status: ApprovalStatus;
  rejected_reason: string | null;
  createdBy?: string;
  approvedBy?: string | null;
}

export interface Report {
  id: string;
  period_month: number;
  period_year: number;
  status: "open" | "closed" | "failed";
  opening_balance: number;
  total_income: number;
  total_expense: number;
  closing_balance: number;
  report_proof_img: string | null;
}

export interface DashboardSummary {
  period: { month: number; year: number };
  previousBalance: number;
  saldo: number;
  income: number;
  expenses: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalData: number;
  totalPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorShape {
  success: false;
  message: string;
}
