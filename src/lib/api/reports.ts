import { api } from "./axios";
import type { ApiResponse, DashboardSummary, Report, PaginationMeta } from "@/src/types";

export const reportsApi = {
  async dashboard() {
    const res = await api.get<ApiResponse<DashboardSummary>>("/report/dashboard");
    return res.data;
  },

  async getAll(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get<ApiResponse<{ reports: Report[]; meta: PaginationMeta }>>("/report", { params });
    return res.data;
  },

  async getDetail(id: string) {
    const res = await api.get<ApiResponse<Report>>(`/report/${id}`);
    return res.data;
  },

  async create(formData: FormData) {
    const res = await api.post<ApiResponse<Report>>("/report", formData);
    return res.data;
  },

  async approve(id: string, payload: { status: "closed" | "failed"; rejected_reason?: string }) {
    const res = await api.patch<ApiResponse<Report>>(`/report/${id}`, payload);
    return res.data;
  },
};
