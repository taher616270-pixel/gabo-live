/**
 * GABO LIVE — Unified Mail Gateway
 * Deploy as Web App: Execute as Me; access: Anyone.
 * Script Properties required:
 *   GAS_SHARED_SECRET = the exact same secret stored in Cloudflare Worker.
 *   SUPPORT_EMAIL = optional support address.
 */
const APP_NAME = "GABO LIVE";
const DEFAULT_SUPPORT_EMAIL = "taher616380@gmail.com";

function doGet() {
  return jsonOutput({ ok: true, service: "GABO LIVE MAIL", version: "1.0" });
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const expected = PropertiesService.getScriptProperties().getProperty("GAS_SHARED_SECRET") || "";
    if (!expected || !constantTimeEqual(String(payload.secret || ""), expected)) {
      return jsonOutput({ success: false, error: "UNAUTHORIZED" });
    }

    const email = normalizeEmail(payload.email);
    if (!isValidEmail(email)) {
      return jsonOutput({ success: false, error: "INVALID_EMAIL" });
    }

    const action = String(payload.action || "");
    const result = sendGaboMail(email, action, payload);
    return jsonOutput({ success: true, action: action, messageId: result || null });
  } catch (error) {
    console.error("GABO mail gateway error: " + safeError(error));
    return jsonOutput({ success: false, error: "MAIL_DELIVERY_FAILED" });
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error("EMPTY_REQUEST");
  const raw = e.postData.contents;
  if (raw.length > 12000) throw new Error("REQUEST_TOO_LARGE");
  return JSON.parse(raw);
}

function sendGaboMail(email, action, payload) {
  const support = PropertiesService.getScriptProperties().getProperty("SUPPORT_EMAIL") || DEFAULT_SUPPORT_EMAIL;
  const safeName = textValue(payload.name, 120);
  const code = String(payload.code || "").trim();
  let subject = "";
  let heading = "";
  let intro = "";
  let content = "";

  if (action === "send" || action === "reset") {
    if (!/^\d{6}$/.test(code)) throw new Error("INVALID_OTP");
    subject = action === "send" ? "رمز التحقق لحسابك" : "استعادة كلمة المرور";
    heading = action === "send" ? "تأكيد البريد الإلكتروني" : "استعادة كلمة المرور";
    intro = action === "send"
      ? "استخدم الرمز التالي لإكمال إنشاء حسابك في GABO LIVE."
      : "استخدم الرمز التالي لإكمال إعادة تعيين كلمة المرور.";
    content = otpBlock(code) + expiryNote();
  } else if (action === "welcome") {
    subject = "مرحباً بك في GABO LIVE";
    heading = "أهلاً بك في عالم GABO LIVE";
    intro = "تم إنشاء حسابك بنجاح. يسعدنا انضمامك إلى مجتمعنا.";
    content = infoBlock("حسابك جاهز الآن", "ابدأ رحلتك واكتشف عالمك الصوتي ومجتمع GABO LIVE.");
  } else if (action === "password_changed") {
    subject = "تم تغيير كلمة مرور حسابك";
    heading = "تم تحديث كلمة المرور";
    intro = "تم تغيير كلمة مرور حساب GABO LIVE بنجاح.";
    content = infoBlock("إذا لم تكن أنت من أجرى هذا التغيير", "يرجى التواصل مع فريق الدعم فوراً لحماية حسابك.");
  } else if (action === "contact") {
    subject = "تحديث من فريق GABO LIVE";
    heading = "رسالة من إدارة GABO LIVE";
    intro = "لديك تحديث جديد بخصوص حسابك.";
    content = infoBlock("تفاصيل الرسالة", textValue(payload.message, 3000));
  } else if (action === "host") {
    subject = "تمت الموافقة على طلب المضيف";
    heading = "مبروك! تمت الموافقة";
    intro = "يسعدنا إبلاغك بأنه تمت الموافقة على طلب انضمامك كمضيف في GABO LIVE.";
    content = infoBlock("تفاصيل الطلب", [
      textValue(payload.city, 120),
      textValue(payload.details, 2000)
    ].filter(Boolean).join("\n"));
  } else {
    throw new Error("UNSUPPORTED_ACTION");
  }

  const htmlBody = emailTemplate(heading, intro, content, support, safeName);
  const textBody = [
    APP_NAME,
    heading,
    intro,
    action === "send" || action === "reset" ? "رمز التحقق: " + code : "",
    "الدعم: " + support
  ].filter(Boolean).join("\n\n");

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody,
    name: APP_NAME,
    replyTo: support
  });
  return "sent";
}

function emailTemplate(heading, intro, content, support, recipientName) {
  const nameLine = recipientName
    ? '<div style="color:#f5e9ff;font-size:15px;margin:0 0 12px">مرحباً ' + escapeHtml(recipientName) + '</div>'
    : "";
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>@keyframes gaboFloat{0%,100%{transform:translateY(0) rotateY(-12deg)}50%{transform:translateY(-7px) rotateY(12deg)}}' +
    '@keyframes gaboGlow{0%,100%{filter:drop-shadow(0 0 8px #9b5cff)}50%{filter:drop-shadow(0 0 19px #e5bd63)}}' +
    '.gaboG{animation:gaboFloat 3.5s ease-in-out infinite,gaboGlow 2.8s ease-in-out infinite}</style></head>' +
    '<body style="margin:0;padding:24px 10px;background:#07070b;font-family:Arial,Tahoma,sans-serif;color:#fff">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#100d18;border:1px solid #3b2b59;border-radius:24px;overflow:hidden">' +
    '<tr><td style="padding:30px 24px 22px;text-align:center;background:linear-gradient(140deg,#171027,#09080f)">' +
    '<div class="gaboG" style="display:inline-block;width:82px;height:82px;line-height:82px;border-radius:24px;font-size:65px;font-weight:900;color:#f6d98d;text-shadow:1px 1px 0 #8a6328,2px 2px 0 #6e4c20,3px 3px 0 #422b16,0 0 20px #9b5cff;transform:perspective(180px) rotateY(-12deg);background:linear-gradient(145deg,#2a1d43,#0c0a12);border:1px solid #b58b4b;box-shadow:inset 0 2px 10px #ffffff18,0 10px 24px #0009">G</div>' +
    '<div style="margin-top:14px;font-size:26px;font-weight:900;letter-spacing:3px;color:#fff">GABO <span style="color:#e9c879">LIVE</span></div>' +
    '<div style="margin-top:7px;color:#bda9df;font-size:12px;letter-spacing:2px">YOUR WORLD • YOUR MOMENT</div>' +
    '</td></tr><tr><td style="padding:30px 26px;text-align:center">' +
    nameLine + '<h1 style="margin:0 0 14px;color:#f1d28a;font-size:23px">' + escapeHtml(heading) + '</h1>' +
    '<p style="margin:0 auto 22px;max-width:470px;color:#e6e0f0;font-size:15px;line-height:1.9">' + escapeHtml(intro) + '</p>' +
    content +
    '<div style="height:1px;background:linear-gradient(90deg,transparent,#73539b,#c6a15c,transparent);margin:28px 0 18px"></div>' +
    '<p style="margin:0;color:#aaa1b8;font-size:12px;line-height:1.8">هذه رسالة آلية من GABO LIVE، يرجى عدم الرد عليها مباشرة.<br>للدعم والمساعدة: <a href="mailto:' + escapeHtml(support) + '" style="color:#e7c675;text-decoration:none">' + escapeHtml(support) + '</a></p>' +
    '</td></tr><tr><td style="padding:15px;text-align:center;background:#09080f;color:#766d82;font-size:11px">© ' + new Date().getFullYear() + ' GABO LIVE — جميع الحقوق محفوظة</td></tr>' +
    '</table></body></html>';
}

function otpBlock(code) {
  return '<div style="margin:24px auto;padding:19px 12px;max-width:340px;border:1px solid #9a7845;border-radius:16px;background:linear-gradient(135deg,#21172e,#100d18)">' +
    '<div style="color:#bcb0ce;font-size:12px;margin-bottom:9px">رمز التحقق المكوّن من 6 أرقام</div>' +
    '<div dir="ltr" style="font-size:36px;font-weight:900;letter-spacing:10px;color:#f4d58a;text-align:center">' + escapeHtml(code) + '</div></div>';
}

function expiryNote() {
  return '<p style="margin:14px 0 0;color:#b9b0c5;font-size:12px;line-height:1.8">صلاحية الرمز 5 دقائق. لا تشارك هذا الرمز مع أي شخص.</p>';
}

function infoBlock(title, body) {
  return '<div style="margin:20px auto 0;padding:17px;max-width:460px;border:1px solid #49345f;border-radius:15px;background:#171123;text-align:right">' +
    '<div style="color:#e9c879;font-weight:700;margin-bottom:8px">' + escapeHtml(title) + '</div>' +
    '<div style="color:#e5dfed;font-size:14px;line-height:1.9;white-space:pre-line">' + escapeHtml(body) + '</div></div>';
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function textValue(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (char) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
  });
}

function constantTimeEqual(a, b) {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function safeError(error) {
  return String(error && error.message ? error.message : error).slice(0, 180);
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
