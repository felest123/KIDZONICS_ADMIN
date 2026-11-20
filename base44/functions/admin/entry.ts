// KIDZONICS ADMIN – SYSTEM MANAGEMENT: the only backend function of the Admin app.
//
// 1. Verifies the caller is signed in to THIS app with the ADMIN role
//    (and, if ADMIN_ALLOWED_EMAILS is set, that their email is on the list).
// 2. Allows only known actions.
// 3. Signs the request with ADMIN_API_SECRET and forwards it to the KidZonics
//    main app's adminApi function, which holds the school's real records.
// The secret and the main app URL are Base44 secrets: browsers never see them.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";

export const ALLOWED_ACTIONS = new Set([
  "overview",
  "teachers.list", "teachers.get", "teachers.invite", "teachers.update", "teachers.setStatus", "teachers.resetPassword",
  "students.list", "students.get", "students.update", "students.transfer", "students.photo",
  "rfid.list", "rfid.pendingTap", "rfid.register", "rfid.deactivate",
  "ai.get", "ai.update",
  "lessons.list", "lessons.save", "lessons.setStatus", "lessons.sendToAgent",
  "inbox.list", "inbox.get", "inbox.reply", "inbox.setStatus",
  "reports.summary", "monitoring.status",
  "settings.get", "settings.update",
  "logs.list",
]);

function secret(name: string) {
  try {
    return secrets.get(name) || "";
  } catch {
    return "";
  }
}

async function hmacHex(key: string, message: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const reply = (status: number, body: unknown) => Response.json(body, { status });

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e?.status === 401 ? null : Promise.reject(e)));
    if (!user) return reply(401, { ok: false, error: "Please sign in." });
    if (user.role !== "admin") return reply(403, { ok: false, error: "This account is not a KidZonics administrator." });

    const allowList = secret("ADMIN_ALLOWED_EMAILS").toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (allowList.length && !allowList.includes(String(user.email).toLowerCase())) {
      return reply(403, { ok: false, error: "This account is not on the administrator list." });
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "session") {
      return reply(200, { ok: true, data: { email: user.email, full_name: user.full_name || "", role: user.role } });
    }
    if (!ALLOWED_ACTIONS.has(action)) return reply(400, { ok: false, error: "Unknown action" });

    const key = secret("ADMIN_API_SECRET");
    const url = secret("MAIN_ADMIN_API_URL");
    if (key.length < 32 || !/^https:\/\//.test(url)) {
      return reply(503, { ok: false, error: "The link to the KidZonics main system is not configured (ADMIN_API_SECRET / MAIN_ADMIN_API_URL)." });
    }

    const raw = JSON.stringify({
      action,
      params: body.params && typeof body.params === "object" ? body.params : {},
      actor: { email: user.email, name: user.full_name || "" },
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomUUID().replace(/-/g, "");
    const signature = await hmacHex(key, `${ts}.${nonce}.${raw}`);

    let upstream: Response;
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kz-timestamp": ts, "x-kz-nonce": nonce, "x-kz-signature": signature },
        body: raw,
        signal: AbortSignal.timeout(25_000),
      });
    } catch {
      return reply(502, { ok: false, error: "Could not reach the KidZonics main system." });
    }
    const data = await upstream.json().catch(() => ({ ok: false, error: `Main system answered HTTP ${upstream.status}` }));
    return reply(upstream.status, data);
  } catch (error) {
    console.error("admin proxy failed", error);
    return reply(500, { ok: false, error: "Internal error" });
  }
}
