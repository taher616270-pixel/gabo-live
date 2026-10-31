const CODE_TTL_SECONDS = 600;
const RESEND_WAIT_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin"
  };
}

async function digest(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") {
      if (!headers["access-control-allow-origin"]) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers });
    }
    if (!headers["access-control-allow-origin"]) return json({ error: "origin_not_allowed" }, 403);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);
    if (!env.RESET_CODES || !env.EMAILJS_SERVICE_ID || !env.EMAILJS_TEMPLATE_ID || !env.EMAILJS_PUBLIC_KEY || !env.OTP_HMAC_SECRET) {
      return json({ error: "service_not_configured" }, 503, headers);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400, headers); }
    const action = String(body.action || "");
    const email = normalizeEmail(body.email);
    if (!validEmail(email)) return json({ error: "invalid_email" }, 400, headers);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const ipKey = await digest("ip:" + ip, env.OTP_HMAC_SECRET);
    const emailKey = await digest("email:" + email, env.OTP_HMAC_SECRET);

    if (action === "send") {
      const cooldownKey = "cooldown:" + emailKey;
      if (await env.RESET_CODES.get(cooldownKey)) {
        return json({ error: "please_wait_before_resending" }, 429, headers);
      }
      const ipLimitKey = "send-ip:" + ipKey;
      const ipCount = Number(await env.RESET_CODES.get(ipLimitKey) || "0");
      if (ipCount >= 10) return json({ error: "rate_limited" }, 429, headers);

      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
      const codeHash = await digest(email + ":" + code, env.OTP_HMAC_SECRET);
      const record = { hash: codeHash, attempts: 0, createdAt: Date.now() };
      await env.RESET_CODES.put("code:" + emailKey, JSON.stringify(record), { expirationTtl: CODE_TTL_SECONDS });
      await env.RESET_CODES.put(cooldownKey, "1", { expirationTtl: RESEND_WAIT_SECONDS });
      await env.RESET_CODES.put(ipLimitKey, String(ipCount + 1), { expirationTtl: 3600 });

      const mail = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service_id: env.EMAILJS_SERVICE_ID,
          template_id: env.EMAILJS_TEMPLATE_ID,
          user_id: env.EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: email,
            passcode: code,
            app_name: "GABO LIVE",
            expires_in: "10 دقائق",
            support_email: "taher616380@gmail.com"
          }
        })
      });
      if (!mail.ok) {
        await env.RESET_CODES.delete("code:" + emailKey);
        await env.RESET_CODES.delete(cooldownKey);
        return json({ error: "emailjs_delivery_failed" }, 502, headers);
      }
      return json({ ok: true, expiresIn: CODE_TTL_SECONDS, resendAfter: RESEND_WAIT_SECONDS }, 200, headers);
    }

    if (action === "verify") {
      const key = "code:" + emailKey;
      const raw = await env.RESET_CODES.get(key);
      if (!raw) return json({ error: "code_expired_or_missing" }, 400, headers);
      let record;
      try { record = JSON.parse(raw); } catch {
        await env.RESET_CODES.delete(key);
        return json({ error: "invalid_code" }, 400, headers);
      }
      if (record.attempts >= MAX_ATTEMPTS) {
        await env.RESET_CODES.delete(key);
        return json({ error: "too_many_attempts" }, 429, headers);
      }
      const code = String(body.code || "").trim();
      if (!/^\d{6}$/.test(code)) return json({ error: "invalid_code" }, 400, headers);
      const supplied = await digest(email + ":" + code, env.OTP_HMAC_SECRET);
      if (supplied !== record.hash) {
        record.attempts += 1;
        await env.RESET_CODES.put(key, JSON.stringify(record), { expirationTtl: Math.max(1, CODE_TTL_SECONDS - Math.floor((Date.now() - record.createdAt) / 1000)) });
        return json({ error: "wrong_code", attemptsRemaining: MAX_ATTEMPTS - record.attempts }, 400, headers);
      }
      await env.RESET_CODES.delete(key);
      const resetTicket = crypto.randomUUID();
      const ticketHash = await digest("ticket:" + resetTicket + ":" + email, env.OTP_HMAC_SECRET);
      await env.RESET_CODES.put("ticket:" + ticketHash, emailKey, { expirationTtl: 300 });
      return json({ ok: true, resetTicket, nextStep: "set_new_password" }, 200, headers);
    }

    return json({ error: "unknown_action" }, 400, headers);
  }
};