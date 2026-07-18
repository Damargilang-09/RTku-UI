import { api } from "./axios";
import type { ApiResponse, PaginationMeta, User, UserRole, UserStatus } from "@/src/types";

export interface SuperAdminUserListData {
  userList: User[];
  meta: PaginationMeta;
}

export interface SuperAdminUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: Exclude<UserRole, "superAdmin">;
}

export const superAdminApi = {
  async getUsers(params: SuperAdminUserListParams = {}) {
    const res = await api.get<ApiResponse<SuperAdminUserListData>>("/super-admin/user-list", {
      params,
    });
    return res.data;
  },

  async getUserDetail(id: string) {
    const res = await api.get<ApiResponse<User>>(`/super-admin/user/${id}`);
    return res.data;
  },

  async setKetuaRT(id: string) {
    const res = await api.patch<ApiResponse<User>>(`/super-admin/user/${id}`);
    return res.data;
  },

  async removeKetuaRT(id: string) {
    const res = await api.patch<ApiResponse<User>>(
      `/super-admin/user/${id}/remove`,
    );
    return res.data;
  },
};