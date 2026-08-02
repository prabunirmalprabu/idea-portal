import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createRoadmapItemsBulk } from "@/lib/smartsheet";
import { isAdminRequest } from "@/lib/auth";

function normalizeHeader(h) {
  return String(h || "").trim().toLowerCase();
}

function pick(row, keys) {
  for (const key of keys) {
    const found = Object.keys(row).find((k) => normalizeHeader(k) === key);
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== "") {
      return String(row[found]).trim();
    }
  }
  return "";
}

// Returns a "YYYY-MM-DD" string for Smartsheet DATE columns, or "" if the
// cell was empty/unparseable. Handles both real Excel dates (parsed as JS
// Date objects via cellDates: true) and plain text dates typed by hand.
function pickDate(row, keys) {
  for (const key of keys) {
    const found = Object.keys(row).find((k) => normalizeHeader(k) === key);
    if (found === undefined) continue;
    const raw = row[found];
    if (raw === undefined || raw === null || raw === "") continue;
    if (raw instanceof Date && !isNaN(raw)) {
      return raw.toISOString().slice(0, 10);
    }
    const parsed = new Date(raw);
    if (!isNaN(parsed)) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return "";
}

export const runtime = "nodejs";

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ error: "The file has no sheets" }, { status: 400 });
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const items = [];
    let skipped = 0;
    for (const row of rows) {
      const title = pick(row, ["idea", "title", "name"]);
      if (!title) {
        skipped += 1;
        continue;
      }
      items.push({
        title,
        description: pick(row, ["description", "details"]),
        status: pick(row, ["status"]),
        timeframe: pick(row, ["release quarter", "timeframe", "quarter"]),
        category: pick(row, ["category"]),
        product: pick(row, ["product"]),
        releaseNotes: pick(row, ["release notes", "notes"]),
        startDate: pickDate(row, ["start date", "start"]),
        targetDate: pickDate(row, ["target date", "end date", "target", "due date"]),
      });
    }

    if (!items.length) {
      return NextResponse.json(
        {
          error:
            "No valid rows found. Make sure the sheet has a column named 'Idea' or 'Title', with one row per item.",
        },
        { status: 400 }
      );
    }

    const created = await createRoadmapItemsBulk(items);
    return NextResponse.json({ created: created.length, skipped });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
