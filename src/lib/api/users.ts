import { api } from "./axios";
import type { ApiResponse, User, PaginationMeta, UserListResponse } from "@/src/types";

export const usersApi = {
  async getAll(params = {}) {
  const res = await api.get<ApiResponse<UserListResponse>>("/users", {
    params,
  });

  return res.data;
},
  async getDetail(id: string) {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },

  async update(id: string, payload: Partial<Pick<User, "status" | "role">>) {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return res.data;
  },
};
