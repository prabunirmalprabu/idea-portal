import { NextResponse } from "next/server";
import { getFieldOptions } from "@/lib/smartsheet";

// Public: read-only field options, used by the submit form (category,
// product) and the roadmap page (release quarters).
export async function GET() {
  try {
    const fields = await getFieldOptions();
    return NextResponse.json({ fields });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
