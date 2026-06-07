require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve your HTML from /public

// ── OAuth client (reads from .env) ──────────────────────────────────────────
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
}

// ── Step 1: redirect user to Google sign-in ──────────────────────────────────
app.get('/auth/login', (req, res) => {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',      // gets refresh_token so it doesn't expire
    prompt: 'consent',           // forces Google to always return refresh_token
    scope: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
  res.redirect(url);
});

// ── Step 2: Google redirects back here with a code ───────────────────────────
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code returned from Google.');

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    // Send tokens to frontend — frontend stores them in memory for this session
    // In production you'd save to a DB keyed by user ID
    res.send(`
      <script>
        window.opener.postMessage(${JSON.stringify(tokens)}, '*');
        window.close();
      </script>
    `);
  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(500).send('Auth failed: ' + err.message);
  }
});

// ── Step 3: refresh an expired access_token ──────────────────────────────────
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'No refresh_token' });

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();
    res.json({ access_token: credentials.access_token, expiry_date: credentials.expiry_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Step 4: fetch inbox emails ────────────────────────────────────────────────
app.get('/gmail/inbox', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const list = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 10,
    });

    if (!list.data.messages) return res.json({ emails: [] });

    const emails = await Promise.all(
      list.data.messages.map(async m => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: m.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject'],
        });
        const headers = msg.data.payload.headers;
        return {
          id: m.id,
          from: headers.find(h => h.name === 'From')?.value || 'unknown',
          subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
          preview: msg.data.snippet,
        };
      })
    );

    res.json({ emails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Step 5: sort an email (move to label) ────────────────────────────────────
app.post('/gmail/sort', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  const { emailId, folder, override } = req.body;
  if (!token) return res.status(401).json({ error: 'No token' });
  if (!emailId) return res.status(400).json({ error: 'Missing emailId' });

  const labelActions = {
    archive:      { removeLabelIds: ['INBOX'], addLabelIds: [] },
    important:    { removeLabelIds: [], addLabelIds: ['IMPORTANT'] },
    trash:        { removeLabelIds: ['INBOX'], addLabelIds: ['TRASH'] },
    'follow-up':  { removeLabelIds: [], addLabelIds: ['STARRED'] },
  };

  // override is used by the undo action to reverse a label change
  const action = override || labelActions[folder];
  if (!action) return res.status(400).json({ error: 'Unknown folder: ' + folder });

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ access_token: token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    await gmail.users.messages.modify({
      userId: 'me', id: emailId,
      requestBody: action,
    });
    res.json({ success: true, emailId, folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✓ Server running at http://localhost:${PORT}`));