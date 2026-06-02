const { handleLeadRequest } = require("../server/email-service.cjs");

function parseBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  try {
    const result = await handleLeadRequest(parseBody(req), {
      referer: req.headers.referer || req.headers.referrer || ""
    });
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || "Unable to send inquiry."
    });
  }
};
