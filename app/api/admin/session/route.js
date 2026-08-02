import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";

// Lightweight auth check used by admin pages to decide whether to show the
// login form, without having to fetch the full ideas list just to find out.
export async function GET(request) {
  return NextResponse.json({ authed: isAdminRequest(request) });
}
