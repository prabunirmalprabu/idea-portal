import crypto from "crypto";

export function makeAdminToken() {
  return crypto
    .createHash("sha256")
    .update(`${process.env.ADMIN_PASSWORD || ""}::${process.env.SMARTSHEET_ACCESS_TOKEN || ""}`)
    .digest("hex");
}

export function isAdminRequest(request) {
  const cookie = request.cookies.get("admin_session");
  if (!cookie || !process.env.ADMIN_PASSWORD) return false;
  return cookie.value === makeAdminToken();
}
