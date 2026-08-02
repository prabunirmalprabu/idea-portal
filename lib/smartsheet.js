const BASE = "https://api.smartsheet.com/2.0";

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

// Column titles are looked up fresh each call (cheap single GET) rather than
// cached across invocations, since serverless functions don't reliably share
// memory between requests.
async function getColumnMaps() {
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const data = await ssFetch(`/sheets/${sheetId}/columns`);
  const byName = {};
  const byId = {};
  for (const col of data.data) {
    byName[col.title] = col.id;
    byId[col.id] = col.title;
  }
  return { byName, byId };
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
      case "Timeframe":
        idea.timeframe = val || "Backlog";
        break;
      case "Category":
        idea.category = val || "Other";
        break;
      case "Source":
        idea.source = val || "Customer";
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

export async function createIdea({ title, description, submitterName, submitterEmail, category }) {
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
    { columnId: byName["Timeframe"], value: "Backlog" },
    { columnId: byName["Category"], value: category || "Other" },
    { columnId: byName["Source"], value: "Customer" },
  ];
  const data = await ssFetch(`/sheets/${sheetId}/rows`, {
    method: "POST",
    body: JSON.stringify([{ toTop: true, cells }]),
  });
  return rowToIdea(data.result[0], byId);
}

export async function createRoadmapItem({ title, description, category, status, timeframe }) {
  requireConfig();
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  const { byName, byId } = await getColumnMaps();
  const cells = [
    { columnId: byName["Idea"], value: title },
    { columnId: byName["Description"], value: description || "" },
    { columnId: byName["Votes"], value: 0 },
    { columnId: byName["Status"], value: status || "Planned" },
    { columnId: byName["Timeframe"], value: timeframe || "Now" },
    { columnId: byName["Category"], value: category || "Feature" },
    { columnId: byName["Source"], value: "Internal" },
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
  if (fields.timeframe) cells.push({ columnId: byName["Timeframe"], value: fields.timeframe });
  if (fields.category) cells.push({ columnId: byName["Category"], value: fields.category });
  const data = await ssFetch(`/sheets/${sheetId}/rows`, {
    method: "PUT",
    body: JSON.stringify([{ id: Number(rowId), cells }]),
  });
  return rowToIdea(data.result[0], byId);
}
