import { NextResponse } from "next/server";
import { getIdeas, createIdea } from "@/lib/smartsheet";

export async function GET() {
  try {
    const ideas = await getIdeas();
    const publicIdeas = ideas.filter((i) => i.status !== "Not Planned");
    return NextResponse.json({ ideas: publicIdeas });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Idea title is required" }, { status: 400 });
    }
    const idea = await createIdea(body);
    return NextResponse.json({ idea }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
