# Production Deployment Guide for Vercel

## Quick Setup

### 1. Add Environment Variables to Vercel

In your Vercel project dashboard, add these environment variables:

```
RESEND_API_KEY=<your-resend-api-key>
LEAD_TO_EMAIL=contact@techmarktech.com
RESEND_FROM_EMAIL=TechMarkTech <contact@techmarktech.com>
```

**Get your RESEND_API_KEY:**
1. Go to https://resend.com
2. Sign up for free
3. Create API key in dashboard
4. Copy and paste into Vercel environment variables

### 2. Verify Domain (Resend)

In Resend dashboard:
1. Add your domain: `techmarktech.com`
2. Verify DNS records
3. Verify sender email: `contact@techmarktech.com`

### 3. Deploy to Vercel

**Option A: Connect GitHub (Recommended)**
```bash
1. Push to GitHub repository
2. Connect repo in Vercel dashboard
3. Vercel auto-deploys on git push
```

**Option B: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

### 4. Test Forms on Production

1. Visit your Vercel domain
2. Go to `/contact.html`
3. Submit a form
4. Check email confirmations arrive

## API Endpoint

**Production URL:** `https://your-domain.vercel.app/api/lead`

**Test locally:**
```bash
curl -X POST http://localhost:3000/api/lead \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "consultation request",
    "fields": {
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Inc",
      "phone": "+1234567890"
    },
    "page": "/contact.html"
  }'
```

## Email Flow

1. **Customer submits form** → Browser sends POST to `/api/lead`
2. **Vercel serverless function processes** → `api/lead.js` receives request
3. **Email service validates** → Checks for valid email, required fields
4. **Sends 2 emails via Resend:**
   - Owner email to: `contact@techmarktech.com`
   - Confirmation to: Customer's email
5. **Response returned** → `{ ok: true, message: "..." }`

## Files Deployed

- **Static:** All `.html`, `assets/`, `images/`, `robots.txt`, `sitemap.xml`
- **API:** `api/lead.js` (serverless function)
- **Config:** `vercel.json` (routing & environment config)
- **Server Logic:** `server/email-service.cjs` (email handling)

## Troubleshooting

### Forms still showing 501 error
- This means the Vercel deployment hasn't completed
- Wait 1-2 minutes and refresh
- Check Vercel dashboard for build errors

### Emails not arriving
1. Check RESEND_API_KEY is set in Vercel environment variables
2. Verify domain in Resend dashboard
3. Check spam folder
4. View Resend logs: https://resend.com/logs

### Getting 400 error on form submit
- Missing email field in form
- Invalid email format
- Missing required fields

## Production Checklist

- [ ] RESEND_API_KEY added to Vercel environment
- [ ] Domain verified in Resend
- [ ] Sender email verified in Resend
- [ ] GitHub repository connected to Vercel
- [ ] Test form submission works
- [ ] Emails arrive in inbox
- [ ] Update contact emails in `main.js` if changed
- [ ] Update WhatsApp number if different

## Next Steps

- Monitor form submissions in Resend dashboard
- Set up email forwarding/automation if needed
- Configure analytics for tracking form conversions
