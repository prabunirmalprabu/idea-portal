const BASE = "https://api.smartsheet.com/2.0";

// Fields that are admin-manageable picklists. The keys are the JS field
// names used throughout the app; the values are the exact Smartsheet
// column titles they map to.
const MANAGED_FIELDS = {
  status: "Status",
  timeframe: "Release Quarter",
  category: "Category",
  product: "Product",
};

function requireConfig() {
  if (!process.env.SMARTSHEET_ACCESS_TOKEN || !process.env.SMARTSHEET_SHEET_ID) {
    throw new Error(
      "Smartsheet is not configured. Set SMARTSHEET_ACCESS_TOKEN and SMARTSHEET_SHEET_ID."
    );
  }
}

async function ssFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.SMARTSHEET_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || `Smartsheet API error (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function getAllColumns() {
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const data = await ssFetch(`/sheets/${sheetId}/columns`);
  return data.data;
}

async function getColumnMaps() {
  const columns = await getAllColumns();
  const byName = {};
  const byId = {};
  for (const col of columns) {
    byName[col.title] = col.id;
    byId[col.id] = col.title;
  }
  return { byName, byId, columns };
}

function rowToIdea(row, byId) {
  const idea = {
    id: String(row.id),
    title: "",
    description: "",
    submitterName: "",
    submitterEmail: "",
    votes: 0,
    status: "New",
    timeframe: "Backlog",
    category: "Other",
    source: "Customer",
    product: "General",
    releaseNotes: "",
    submitted: row.createdAt || null,
  };
  for (const cell of row.cells || []) {
    const name = byId[cell.columnId];
    const val = cell.value ?? "";
    switch (name) {
      case "Idea":
        idea.title = val || "Untitled";
        break;
      case "Description":
        idea.description = val || "";
        break;
      case "Submitter Name":
        idea.submitterName = val || "";
        break;
      case "Submitter Email":
        idea.submitterEmail = val || "";
        break;
      case "Votes":
        idea.votes = Number(val) || 0;
        break;
      case "Status":
        idea.status = val || "New";
        break;
      case "Release Quarter":
        idea.timeframe = val || "Backlog";
        break;
      case "Category":
        idea.category = val || "Other";
        break;
      case "Source":
        idea.source = val || "Customer";
        break;
      case "Product":
        idea.product = val || "General";
        break;
      case "Release Notes":
        idea.releaseNotes = val || "";
        break;
      default:
        break;
    }
  }
  return idea;
}

export async function getIdeas() {
  requireConfig();
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const { byId } = await getColumnMaps();
  const sheet = await ssFetch(`/sheets/${sheetId}`);
  const ideas = (sheet.rows || []).map((row) => rowToIdea(row, byId));
  return ideas.sort((a, b) => b.votes - a.votes);
}

export async function getRoadmapIdeas() {
  const ideas = await getIdeas();
  return ideas.filter((i) => i.timeframe !== "Backlog");
}

export async function createIdea({ title, description, submitterName, submitterEmail, category, product }) {
  requireConfig();
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const { byName, byId } = await getColumnMaps();
  const cells = [
    { columnId: byName["Idea"], value: title },
    { columnId: byName["Description"], value: description || "" },
    { columnId: byName["Submitter Name"], value: submitterName || "" },
    { columnId: byName["Submitter Email"], value: submitterEmail || "" },
    { columnId: byName["Votes"], value: 0 },
    { columnId: byName["Status"], value: "New" },
    { columnId: byName["Release Quarter"], value: "Backlog" },
    { columnId: byName["Category"], value: category || "Other" },
    { columnId: byName["Source"], value: "Customer" },
    { columnId: byName["Product"], value: product || "General" },
  ];
  const data = await ssFetch(`/sheets/${sheetId}/rows`, {
    method: "POST",
    body: JSON.stringify([{ toTop: true, cells }]),
  });
  return rowToIdea(data.result[0], byId);
}

export async function createRoadmapItem({
  title,
  description,
  category,
  status,
  timeframe,
  product,
  releaseNotes,
}) {
  requireConfig();
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const { byName, byId } = await getColumnMaps();
  const cells = [
    { columnId: byName["Idea"], value: title },
    { columnId: byName["Description"], value: description || "" },
    { columnId: byName["Votes"], value: 0 },
    { columnId: byName["Status"], value: status || "Planned" },
    { columnId: byName["Release Quarter"], value: timeframe || "Backlog" },
    { columnId: byName["Category"], value: category || "Feature" },
    { columnId: byName["Source"], value: "Internal" },
    { columnId: byName["Product"], value: product || "General" },
    { columnId: byName["Release Notes"], value: releaseNotes || "" },
  ];
  const data = await ssFetch(`/sheets/${sheetId}/rows`, {
    method: "POST",
    body: JSON.stringify([{ toTop: true, cells }]),
  });
  return rowToIdea(data.result[0], byId);
}

export async function voteIdea(rowId) {
  requireConfig();
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const { byName, byId } = await getColumnMaps();
  const rowData = await ssFetch(`/sheets/${sheetId}/rows/${rowId}`);
  const current = rowToIdea(rowData, byId).votes;
  const data = await ssFetch(`/sheets/${sheetId}/rows`, {
    method: "PUT",
    body: JSON.stringify([{ id: Number(rowId), cells: [{ columnId: byName["Votes"], value: current + 1 }] }]),
  });
  return rowToIdea(data.result[0], byId);
}

export async function updateIdea(rowId, fields) {
  requireConfig();
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const { byName, byId } = await getColumnMaps();
  const cells = [];
  if (fields.status) cells.push({ columnId: byName["Status"], value: fields.status });
  if (fields.timeframe) cells.push({ columnId: byName["Release Quarter"], value: fields.timeframe });
  if (fields.category) cells.push({ columnId: byName["Category"], value: fields.category });
  if (fields.product) cells.push({ columnId: byName["Product"], value: fields.product });
  if (fields.releaseNotes !== undefined) {
    cells.push({ columnId: byName["Release Notes"], value: fields.releaseNotes });
  }
  const data = await ssFetch(`/sheets/${sheetId}/rows`, {
    method: "PUT",
    body: JSON.stringify([{ id: Number(rowId), cells }]),
  });
  return rowToIdea(data.result[0], byId);
}

// Bulk-creates roadmap items (used by the Excel import). Chunks defensively
// since Smartsheet caps row-add calls at 500 rows.
export async function createRoadmapItemsBulk(items) {
  requireConfig();
  if (!items.length) return [];
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const { byName, byId } = await getColumnMaps();
  const rows = items.map((item) => ({
    toTop: true,
    cells: [
      { columnId: byName["Idea"], value: item.title },
      { columnId: byName["Description"], value: item.description || "" },
      { columnId: byName["Votes"], value: 0 },
      { columnId: byName["Status"], value: item.status || "Planned" },
      { columnId: byName["Release Quarter"], value: item.timeframe || "Backlog" },
      { columnId: byName["Category"], value: item.category || "Feature" },
      { columnId: byName["Source"], value: "Internal" },
      { columnId: byName["Product"], value: item.product || "General" },
      { columnId: byName["Release Notes"], value: item.releaseNotes || "" },
    ],
  }));
  const CHUNK = 400;
  const created = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const data = await ssFetch(`/sheets/${sheetId}/rows`, {
      method: "POST",
      body: JSON.stringify(chunk),
    });
    created.push(...(data.result || []).map((row) => rowToIdea(row, byId)));
  }
  return created;
}

// Returns the current dropdown options for every admin-manageable field,
// keyed by the app's field names (status, timeframe, category, product).
export async function getFieldOptions() {
  requireConfig();
  const columns = await getAllColumns();
  const result = {};
  for (const [fieldName, columnTitle] of Object.entries(MANAGED_FIELDS)) {
    const col = columns.find((c) => c.title === columnTitle);
    result[fieldName] = col?.options || [];
  }
  return result;
}

// Appends a new dropdown value to one of the admin-manageable fields.
// fieldName must be one of: status, timeframe, category, product.
export async function addFieldOption(fieldName, newOption) {
  requireConfig();
  const columnTitle = MANAGED_FIELDS[fieldName];
  if (!columnTitle) {
    throw new Error(`Unknown field "${fieldName}". Expected one of: ${Object.keys(MANAGED_FIELDS).join(", ")}`);
  }
  const trimmed = (newOption || "").trim();
  if (!trimmed) {
    throw new Error("New option cannot be empty.");
  }
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const columns = await getAllColumns();
  const col = columns.find((c) => c.title === columnTitle);
  if (!col) {
    throw new Error(`Column "${columnTitle}" not found on the sheet.`);
  }
  const existing = col.options || [];
  if (existing.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
    return { field: fieldName, options: existing };
  }
  const options = [...existing, trimmed];
  const updated = await ssFetch(`/sheets/${sheetId}/columns/${col.id}`, {
    method: "PUT",
    body: JSON.stringify({ type: "PICKLIST", options }),
  });
  return { field: fieldName, options: updated.result?.options || options };
}
