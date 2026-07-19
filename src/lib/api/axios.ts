import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@/src/types";

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Instance axios tunggal dipakai semua modul di lib/api/*.
// baseURL + withCredentials di-set sekali di sini saja.
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/RTku/api",
  withCredentials: true, // kirim cookie JWT ke backend
});

// Semua error axios (network, 4xx, 5xx) diseragamkan jadi ApiError
// dengan pesan dari backend, biar komponen cukup nangkep satu tipe error.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const message = error.response?.data?.message ?? error.message ?? "Terjadi kesalahan";
    const statusCode = error.response?.status ?? 0;
    return Promise.reject(new ApiError(message, statusCode));
  },
);
