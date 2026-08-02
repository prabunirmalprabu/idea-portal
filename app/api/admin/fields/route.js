import { NextResponse } from "next/server";
import { getFieldOptions, addFieldOption } from "@/lib/smartsheet";
import { isAdminRequest } from "@/lib/auth";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const fields = await getFieldOptions();
    return NextResponse.json({ fields });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Body: { field: "status" | "timeframe" | "category" | "product", value: string }
export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { field, value } = await request.json();
    const result = await addFieldOption(field, value);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
