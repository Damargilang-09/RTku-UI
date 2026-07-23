import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://kas-rt-api.vercel.app/RTku/api";

async function proxy(req: NextRequest, path: string[]) {
  const url = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host"); 

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    credentials: "include",
  });

  const resBody = await backendRes.text();
  const res = new NextResponse(resBody, { status: backendRes.status });

  const setCookie = backendRes.headers.getSetCookie?.() ?? [];
  setCookie.forEach((cookie) => res.headers.append("Set-Cookie", cookie));

  res.headers.set(
    "Content-Type",
    backendRes.headers.get("Content-Type") ?? "application/json",
  );

  return res;
}

export const GET = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  ctx.params.then(({ path }) => proxy(req, path));
export const POST = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  ctx.params.then(({ path }) => proxy(req, path));
export const PATCH = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  ctx.params.then(({ path }) => proxy(req, path));
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  ctx.params.then(({ path }) => proxy(req, path));