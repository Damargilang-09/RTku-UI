import { NextRequest, NextResponse } from "next/server";

const ADMIN_PATHS = [
  "/dashboard",
  "/jenis-iuran",
  "/tagihan-warga",
  "/konfirmasi-pembayaran",
  "/pengeluaran",
  "/pemasukan",
  "/laporan",
];

function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));
  if (!isAdminPath) return NextResponse.next();

  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.next();

  const payload = decodeJwtPayload(token);
  const role = payload?.role;

  if (role === "warga") {
    return NextResponse.redirect(new URL("/beranda", request.url));
  }

  const isStaff = role === "bendahara" || role === "ketuaRT";
  const deviceType = request.cookies.get("device_type")?.value;

  if (isStaff && deviceType === "mobile") {
    return NextResponse.redirect(new URL("/beranda", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jenis-iuran/:path*",
    "/tagihan-warga/:path*",
    "/konfirmasi-pembayaran/:path*",
    "/pengeluaran/:path*",
    "/pemasukan/:path*",
    "/laporan/:path*",
  ],
};