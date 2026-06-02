const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TO_EMAIL = "contact@techmarktech.com";
const DEFAULT_FROM_EMAIL = "TechMarkTech <contact@techmarktech.com>";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeFields(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fields)
      .map(([key, value]) => [String(key).trim(), String(value ?? "").trim()])
      .filter(([key, value]) => key && value)
  );
}

function findField(fields, matcher) {
  const entry = Object.entries(fields).find(([key]) => matcher(key.toLowerCase()));
  return entry ? entry[1] : "";
}

function buildLeadTable(fields) {
  return Object.entries(fields)
    .map(
      ([key, value]) => `
        <tr>
          <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb;background:#f8fafc;width:190px;">${escapeHtml(key)}</th>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value).replace(/\n/g, "<br>")}</td>
        </tr>`
    )
    .join("");
}

function buildPlainText(fields, context) {
  const lines = [
    `Form: ${context.formName}`,
    `Page: ${context.page || "Not available"}`,
    "",
    ...Object.entries(fields).map(([key, value]) => `${key}: ${value}`)
  ];

  return lines.join("\n");
}

function ownerEmailHtml(fields, context) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#07111f;line-height:1.5;">
      <h1 style="margin:0 0 8px;font-size:24px;">New TechMarkTech inquiry</h1>
      <p style="margin:0 0 18px;color:#475569;">A visitor submitted the ${escapeHtml(context.formName)} form.</p>
      <table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${buildLeadTable(fields)}
        <tr>
          <th style="padding:10px 12px;text-align:left;background:#f8fafc;width:190px;">Submitted from</th>
          <td style="padding:10px 12px;">${escapeHtml(context.page || "Not available")}</td>
        </tr>
      </table>
    </div>`;
}

function clientEmailHtml(clientName, formName) {
  const greeting = clientName ? `Hi ${escapeHtml(clientName)},` : "Hi,";

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#07111f;line-height:1.6;">
      <h1 style="margin:0 0 12px;font-size:24px;">Thank you for contacting TechMarkTech</h1>
      <p>${greeting}</p>
      <p>Thank you for submitting your ${escapeHtml(formName)}. We have received your details and will review your requirement shortly.</p>
      <p>Our team will get back to you soon to understand your project, portal, automation, or support needs in more detail.</p>
      <p style="margin-top:22px;">Regards,<br><strong>Team TechMarkTech</strong></p>
    </div>`;
}

async function sendResendEmail(apiKey, payload) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body && body.message ? body.message : "Email provider rejected the request.";
    throw new Error(message);
  }

  return body;
}

async function handleLeadRequest(payload, requestMeta = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.LEAD_TO_EMAIL || DEFAULT_TO_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: {
        ok: false,
        message: "Email service is not configured. Set RESEND_API_KEY on the server."
      }
    };
  }

  const fields = normalizeFields(payload.fields);
  const formName = String(payload.formName || "website inquiry").trim();
  const page = String(payload.page || requestMeta.referer || "").trim();
  const clientEmail = findField(fields, (key) => key === "email" || key.includes("email"));
  const clientName = findField(fields, (key) => key === "name" || key.includes("name"));

  if (!Object.keys(fields).length) {
    return {
      statusCode: 400,
      body: { ok: false, message: "No form data was received." }
    };
  }

  if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return {
      statusCode: 400,
      body: { ok: false, message: "A valid client email is required for confirmation." }
    };
  }

  const context = { formName, page };
  const ownerSubject = `New TechMarkTech ${formName}`;
  const clientSubject = "Thank you for contacting TechMarkTech";

  await sendResendEmail(apiKey, {
    from: fromEmail,
    to: [toEmail],
    reply_to: clientEmail,
    subject: ownerSubject,
    html: ownerEmailHtml(fields, context),
    text: buildPlainText(fields, context)
  });

  await sendResendEmail(apiKey, {
    from: fromEmail,
    to: [clientEmail],
    reply_to: toEmail,
    subject: clientSubject,
    html: clientEmailHtml(clientName, formName),
    text: `Hi${clientName ? ` ${clientName}` : ""},\n\nThank you for submitting your ${formName}. We have received your details and will get back to you soon.\n\nRegards,\nTeam TechMarkTech`
  });

  return {
    statusCode: 200,
    body: {
      ok: true,
      message: "Inquiry sent successfully."
    }
  };
}

module.exports = {
  handleLeadRequest
};
