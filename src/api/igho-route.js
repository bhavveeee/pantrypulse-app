import { getToken } from "next-auth/jwt";
import fs from "fs";
import path from "path";

const ALLOWED_DOMAIN = "curiousinc.com";
// Only these three files, only these names — no path traversal, no directory listing.
const FILES = {
  "igho-needs-0.js":"application/javascript; charset=utf-8","igho-needs-1.js":"application/javascript; charset=utf-8",
  "igho-needs-2.js":"application/javascript; charset=utf-8","igho-needs-3.js":"application/javascript; charset=utf-8",
  "igho-needs-4.js":"application/javascript; charset=utf-8","igho-needs-5.js":"application/javascript; charset=utf-8",
  "igho-engine.js":              "application/javascript; charset=utf-8",
  "recipe-videos.generated.json":"application/json; charset=utf-8",
};

// Serves the IGHO engine assets from /private/igho behind the same @curiousinc.com session as the app.
// Unlike the HTML, these are immutable per build and 14.5 MB, so they are cacheable for a day.
export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token?.email || "").toLowerCase();
  if (!token || !email.endsWith("@" + ALLOWED_DOMAIN)) { res.status(401).end(); return; }

  const name = String(req.query.f || "");
  const type = FILES[name];
  if (!type) { res.status(404).end(); return; }

  const filePath = path.join(process.cwd(), "private", "igho", name);
  const buf = fs.readFileSync(filePath);
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", "private, max-age=86400, stale-while-revalidate=604800");
  res.status(200).send(buf);
}
