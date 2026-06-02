const { handleLeadRequest } = require("../../server/email-service.cjs");

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Method not allowed." })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const result = await handleLeadRequest(payload, {
      referer: event.headers.referer || event.headers.referrer || ""
    });

    return {
      statusCode: result.statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.body)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: error.message || "Unable to send inquiry."
      })
    };
  }
};
