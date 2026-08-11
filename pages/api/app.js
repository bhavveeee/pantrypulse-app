import { getToken } from "next-auth/jwt";
import fs from "fs";
import path from "path";

const ALLOWED_DOMAIN = "curiousinc.com";

// Serves the PantryPulse HTML. Because the file lives OUTSIDE /public,
// it is never directly reachable — the only way to get it is through this
// route, which first verifies a valid @curiousinc.com session.
export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token?.email || "").toLowerCase();

  if (!token || !email.endsWith("@" + ALLOWED_DOMAIN)) {
    res.setHeader("Location", "/login");
    res.status(302).end();
    return;
  }

  const filePath = path.join(process.cwd(), "private", "pantrypulse.html");
  const html = fs.readFileSync(filePath, "utf8");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Don't let browsers/CDNs cache the protected page for logged-out users.
  res.setHeader("Cache-Control", "no-store, must-revalidate");
  res.status(200).send(html);
}
