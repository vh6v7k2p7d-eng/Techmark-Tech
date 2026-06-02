require('dotenv').config();
const express = require('express');
const path = require('path');
const { handleLeadRequest } = require('./server/email-service.cjs');

const app = express();
const PORT = process.env.PORT || 5173;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from project root
app.use(express.static(path.join(__dirname)));

// API endpoint for form submissions
app.post('/api/lead', async (req, res) => {
  try {
    const result = await handleLeadRequest(req.body, {
      referer: req.headers.referer || req.headers.referrer || ''
    });

    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error processing lead:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'Unable to send inquiry.'
    });
  }
});

// Fallback for Netlify functions (redirect to /api/lead)
app.post('/.netlify/functions/lead', async (req, res) => {
  try {
    const result = await handleLeadRequest(req.body, {
      referer: req.headers.referer || req.headers.referrer || ''
    });

    res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error('Error processing lead:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'Unable to send inquiry.'
    });
  }
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ TechMarkTech server running at http://localhost:${PORT}`);
  console.log(`📧 Form submissions will be sent to /api/lead`);
  if (process.env.RESEND_API_KEY) {
    console.log(`✓ Email service configured with Resend API`);
  } else {
    console.log(`⚠️  RESEND_API_KEY not set - emails will fail. Set it in .env file`);
  }
});
