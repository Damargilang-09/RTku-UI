import { api } from "./axios";
import type { ApiResponse, Payment, PaginationMeta } from "@/src/types";

export const paymentsApi = {
  async create(billId: string, formData: FormData) {
    const res = await api.post<ApiResponse<Payment>>(`/payment/${billId}`, formData);
    return res.data;
  },

  async getMyPayments(params?: { page?: number; limit?: number }) {
    const res = await api.get<ApiResponse<{ formattedPayments: Payment[]; meta: PaginationMeta }>>(
      "/payment/transaction",
      { params },
    );
    return res.data;
  },

  async getDetail(id: string) {
    const res = await api.get<ApiResponse<Payment>>(`/payment/detail/${id}`);
    return res.data;
  },

  // bendahara
  async getAll(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get<ApiResponse<{ formattedPayments: Payment[]; meta: PaginationMeta }>>(
      "/payment",
      { params },
    );
    return res.data;
  },

  async approve(id: string, payload: { status: "approved" | "rejected"; rejectedReason?: string }) {
    const res = await api.patch<ApiResponse<Payment>>(`/payment/${id}`, payload);
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete(`/payment/${id}`);
    return res.data;
  },
};
