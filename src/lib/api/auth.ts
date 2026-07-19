import { api } from "./axios";
import type { ApiResponse, User } from "@/src/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  houseNumber: string;
  address: string;
}

export const authApi = {
  async login(payload: LoginPayload) {
    const res = await api.post<ApiResponse<User>>("/auth/login", payload);
    return res.data;
  },

  async register(payload: RegisterPayload) {
    const res = await api.post<ApiResponse<User>>("/auth/register", payload);
    return res.data;
  },

  async me() {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data;
  },

  async logout() {
    const res = await api.post<ApiResponse<null>>("/auth/logout");
    return res.data;
  },
};
