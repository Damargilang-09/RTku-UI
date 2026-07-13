import { api } from "./axios";
import type { ApiResponse, FeeType } from "@/src/types";

export const feeTypesApi = {
  async getAll() {
    const res = await api.get<ApiResponse<FeeType[]>>("/fee-types");
    return res.data;
  },

  async getDetail(id: string) {
    const res = await api.get<ApiResponse<FeeType>>(`/fee-types/${id}`);
    return res.data;
  },

  async create(payload: {
    name: string;
    description?: string;
    amount: number;
    dueDay?: number;
    billingPeriod: string;
  }) {
    const res = await api.post<ApiResponse<FeeType>>("/fee-types", payload);
    return res.data;
  },
};
