import { NextResponse } from "next/server";
import { makeAdminToken } from "@/lib/auth";

export async function POST(request) {
  const { password } = await request.json();
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin password not configured on server" }, { status: 500 });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", makeAdminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
