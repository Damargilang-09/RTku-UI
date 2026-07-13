import { api } from "./axios";
import type { ApiResponse, Expense, PaginationMeta } from "@/src/types";

export const expensesApi = {
  async getAll(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get<ApiResponse<Expense[]>>(
      "/expenses",
      { params },
    );
    return res.data;
  },

  async getDetail(id: string) {
    const res = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return res.data;
  },

  async create(formData: FormData) {
    const res = await api.post<ApiResponse<Expense>>("/expenses", formData);
    return res.data;
  },

  async approve(id: string, payload: { status: "approved" | "rejected"; rejectedReason?: string }) {
    const res = await api.patch<ApiResponse<Expense>>(`/expenses/${id}`, payload);
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },
};
