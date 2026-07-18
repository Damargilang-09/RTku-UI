import { api } from "./axios";
import type { ApiResponse, Bill, PaginationMeta } from "@/src/types";

export interface BillListParams {
  page?: number;
  limit?: number;
  status?: string;
  feeTypeId?: string;
  batchId?: string;
  periodMonth?: number;
  periodYear?: number;
}

export interface GenerateBillsPayload {
  feeTypeId: string;
  periodMonth?: number;
  periodYear?: number;
  dueDate?: string;
}

export interface GenerateBillsResult {
  batchId: string;
  bills: Bill[];
  auditLogId: string;
}

export interface CancelBatchResult {
  batchId: string;
  totalBillInBatch: number;
  cancelledCount: number;
  paidSkippedCount: number;
  pendingSkippedCount: number;
  alreadyCancelledCount: number;
  cancelledBillIds: string[];
  paidSkippedBillIds: string[];
  pendingSkippedBillIds: string[];
  alreadyCancelledBillIds: string[];
  auditLogId: string;
}

export const billsApi = {
  async getMyBills(params?: { page?: number; limit?: number }) {
    const res = await api.get<ApiResponse<Bill[]>>("/my-bills", { params });
    return res.data;
  },

  async getMyBillDetail(id: string) {
    const res = await api.get<ApiResponse<Bill>>(`/my-bills/${id}`);
    return res.data;
  },

  async getAllBills(params: BillListParams = {}) {
    const res = await api.get<ApiResponse<Bill[]> & { meta: PaginationMeta }>("/bills", { params });
    return res.data;
  },

  async getBillDetail(id: string) {
    const res = await api.get<ApiResponse<Bill>>(`/bills/${id}`);
    return res.data;
  },

  async generateBills(payload: GenerateBillsPayload) {
    const res = await api.post<ApiResponse<GenerateBillsResult>>("/bills/generate", payload);
    return res.data;
  },

  async cancelBillBatch(batchId: string) {
    const res = await api.patch<ApiResponse<CancelBatchResult>>("/bills/cancel-batch", { batchId });
    return res.data;
  },
};
