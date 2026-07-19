import { api } from "./axios";
import type {
  ApiResponse,
  User,
  UserListResponse,
  UserRole,
  UserStatus,
} from "@/src/types";

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: Extract<UserRole, "warga" | "bendahara">;
}

export const usersApi = {
  async getAll(params: UserListParams = {}) {
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

  async delete(id: string) {
    const res = await api.delete<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },
};
