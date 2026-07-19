import { api } from "./axios";
import type { ApiResponse, Income, PaginationMeta } from "@/src/types";

export const incomeApi = {
    async getAll(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get<ApiResponse<Income[]>>(
      "/income",
      { params },
    );

    return res.data;
  },

  async getDetail(id: string) {
    const res = await api.get<ApiResponse<Income>>(`/income/${id}`);
    return res.data;
  },

  async create(payload: {
    income_code: string;
    title: string;
    description?: string;
    amount: number;
    income_date: string;
  }) {
    const res = await api.post<ApiResponse<Income>>("/income", payload);
    return res.data;
  },

  async approve(id: string, payload: { status: "approved" | "rejected"; rejected_reason?: string }) {
    const res = await api.patch<ApiResponse<Income>>(`/income/${id}`, payload);
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete(`/income/${id}`);
    return res.data;
  },
};
