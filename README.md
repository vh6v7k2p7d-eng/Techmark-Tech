# TechMarkTech Website

Static multi-page website revamp for TechMarkTech.

## Pages

- `index.html`
- `about.html`
- `services.html`
- `real-estate-portal.html`
- `tourism-portal.html`
- `amc-support.html`
- `case-studies.html`
- `contact.html`

## Local Preview

Run the local Node server from this folder:

```bash
node server/local-dev.cjs
```

Then open:

```text
http://localhost:4173
```

The Node server supports `/api/lead`, so the contact forms can submit locally. A plain static server such as `python3 -m http.server` cannot handle form POST requests and will return a 501 error.

To send real emails locally, run with the provider environment variables:

```bash
RESEND_API_KEY=your_resend_api_key \
RESEND_FROM_EMAIL='TechMarkTech <contact@techmarktech.com>' \
LEAD_TO_EMAIL=contact@techmarktech.com \
node server/local-dev.cjs
```

Or create `.env.local` from `.env.example`, fill in the real values, and then run:

```bash
node server/local-dev.cjs
```

## Deployment Notes

- Upload the full folder to any static host or configure the project root as the public directory.
- Lead forms POST to `/api/lead` on Vercel or `/.netlify/functions/lead` on Netlify.
- The email provider implementation uses Resend through a serverless function, so the API key is never exposed in browser JavaScript.
- Add these environment variables in your hosting dashboard:
  - `RESEND_API_KEY`: your Resend API key.
  - `RESEND_FROM_EMAIL`: verified sender such as `TechMarkTech <contact@techmarktech.com>`.
  - `LEAD_TO_EMAIL`: `contact@techmarktech.com`.
- In Resend, verify the `techmarktech.com` sending domain before using `contact@techmarktech.com` as the sender.
- After successful submission, TechMarkTech receives the full form data and the client receives an automatic thank-you email.
- If the email endpoint is unavailable, the site opens the visitor's email client as a fallback addressed to `contact@techmarktech.com`.
- WhatsApp CTAs open a chat to `+91 7506001640`.
- Update `contact@techmarktech.com` or `917506001640` in the HTML and `assets/js/main.js` if contact details change.
- Replace generated dashboard mockups in `assets/images/` with real product screenshots when available.
