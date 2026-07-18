import { api } from "./axios";
import type { ApiResponse, BillingPeriod, FeeType } from "@/src/types";

export interface FeeTypePayload {
  name: string;
  description?: string;
  amount: number;
  billingPeriod: BillingPeriod;
  dueDay?: number;
}

export const feeTypesApi = {
  async getAll() {
    const res = await api.get<ApiResponse<FeeType[]>>("/fee-types");
    return res.data;
  },

  async getDetail(id: string) {
    const res = await api.get<ApiResponse<FeeType>>(`/fee-types/${id}`);
    return res.data;
  },

  async create(payload: FeeTypePayload) {
    const res = await api.post<ApiResponse<FeeType>>("/fee-types", payload);
    return res.data;
  },

  async update(id: string, payload: Partial<FeeTypePayload>) {
    const res = await api.patch<ApiResponse<FeeType>>(
      `/fee-types/${id}`,
      payload,
    );
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete<ApiResponse<FeeType>>(`/fee-types/${id}`);
    return res.data;
  },
};
