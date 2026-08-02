import { NextResponse } from "next/server";
import { updateIdea } from "@/lib/smartsheet";
import { isAdminRequest } from "@/lib/auth";

export async function PATCH(request, { params }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const idea = await updateIdea(params.id, body);
    return NextResponse.json({ idea });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
