import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = [
    "Idea",
    "Description",
    "Status",
    "Release Quarter",
    "Category",
    "Product",
    "Release Notes",
    "Start Date",
    "Target Date",
  ];
  const exampleRow = [
    "Example: Dark mode support",
    "Add a dark theme option across the app",
    "Planned",
    "Q4 2026",
    "Feature",
    "General",
    "",
    "2026-10-01",
    "2026-11-15",
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 40 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Roadmap Items");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="idea-portal-import-template.xlsx"',
    },
  });
}
