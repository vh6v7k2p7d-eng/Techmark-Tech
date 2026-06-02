# TechMarkTech Production Setup

## What's Ready for Production

✅ **Email API** - `/api/lead.js` handles form submissions via Vercel
✅ **Email Service** - Resend integration for sending confirmation emails  
✅ **Vercel Config** - `vercel.json` properly configured
✅ **Environment Setup** - All environment variables documented
✅ **Static Site** - All HTML/CSS/JS files ready to serve

## Deploy to Production (3 Steps)

### Step 1: Get Resend API Key
1. Sign up: https://resend.com
2. Create API key
3. Verify your domain and sender email

### Step 2: Connect to Vercel
```bash
# Option A: Via GitHub (Recommended)
git push origin main
# Then connect repo in Vercel dashboard

# Option B: Via Vercel CLI
npm install -g vercel
vercel
```

### Step 3: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
RESEND_API_KEY = your_api_key_from_step_1
LEAD_TO_EMAIL = contact@techmarktech.com
RESEND_FROM_EMAIL = TechMarkTech <contact@techmarktech.com>
```

**Done!** Your site is now live with working email forms.

## Local Testing (Before Deploying)

To test locally with a real email service:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add your RESEND_API_KEY to `.env` file**

3. **Start the server:**
   ```bash
   npm start
   # Opens on http://localhost:5173
   ```

4. **Test a form:**
   - Go to `/contact.html`
   - Fill and submit any form
   - Check email arrives

## For Testing Without Email Service

Use **Mailhog** to capture emails locally:

```bash
# Install Mailhog
brew install mailhog

# Run it
mailhog

# Web UI at: http://localhost:1025
# SMTP at: localhost:1025
```

Then update `.env`:
```
# Remove RESEND_API_KEY or leave invalid
# Emails will fail gracefully with helpful error
```

## File Structure

```
├── index.html                      # Home page
├── about.html, services.html, ...  # Other pages
├── contact.html                    # Form pages
├── assets/
│   ├── css/                        # Stylesheets
│   ├── js/main.js                  # Form submission logic
│   └── images/                     # Images
├── api/
│   └── lead.js                     # Vercel serverless function (API)
├── server/
│   └── email-service.cjs           # Resend email logic
├── vercel.json                     # Vercel configuration
├── package.json                    # Dependencies
├── .env.example                    # Environment template
└── .env                            # Local environment (not committed)
```

## How It Works

1. **User submits form** on any page → `main.js` sends POST to `/api/lead`
2. **Vercel receives request** → Runs `api/lead.js` serverless function
3. **Function validates** form data and calls `handleLeadRequest()`
4. **Sends 2 emails:**
   - Owner notification with all form details
   - Customer confirmation email
5. **Returns success** → Form shows thank you message

## Monitoring & Debugging

- **Check deployments:** https://vercel.com/dashboard
- **Check emails:** https://resend.com/logs
- **View errors:** Vercel dashboard → Deployments → Logs
- **Test API directly:**
  ```bash
  curl -X POST https://your-domain.vercel.app/api/lead \
    -H "Content-Type: application/json" \
    -d '{"formName":"test","fields":{"name":"John","email":"john@example.com"}}'
  ```

## Support

- **Email issues?** Check Resend logs
- **Form not submitting?** Open browser DevTools → Console/Network
- **Need to change contact email?** Update in `LEAD_TO_EMAIL` environment variable

See `PRODUCTION_DEPLOYMENT.md` for detailed deployment guide.
