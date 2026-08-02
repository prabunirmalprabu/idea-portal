import { NextResponse } from "next/server";
import { voteIdea } from "@/lib/smartsheet";

export async function POST(request, { params }) {
  try {
    const idea = await voteIdea(params.id);
    return NextResponse.json({ idea });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
