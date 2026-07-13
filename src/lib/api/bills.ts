import { api } from "./axios";
import type { ApiResponse, Bill, PaginationMeta } from "@/src/types";

export const billsApi = {
  async getMyBills(params?: { page?: number; limit?: number }) {
    const res = await api.get<ApiResponse<Bill[]>>("/my-bills", { params });
    return res.data;
  },

  async getMyBillDetail(id: string) {
    const res = await api.get<ApiResponse<Bill>>(`/my-bills/${id}`);
    return res.data;
  },

  // bendahara
  async getAllBills(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get<ApiResponse<Bill[]>>("/bills", { params });
    return res.data;
  },

  async generateBills(payload: {
    feeTypeId: string;
    periodMonth?: number;
    periodYear?: number;
    dueDate: string;
  }) {
    const res = await api.post("/bills/generate", payload);
    return res.data;
  },
};
