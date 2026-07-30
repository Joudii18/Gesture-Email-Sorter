# 💌 Gesture Email Sorter

A gesture-controlled email sorter that uses your webcam to track hand movements and sort Gmail emails into folders — no keyboard or mouse needed.

Built with MediaPipe for hand tracking, Node.js + Express for the backend, and the Gmail API for real inbox access.

---

## 🎥 Demo
https://github.com/user-attachments/assets/adec2b43-21d8-42ab-86c4-febd47056209
> If the video doesn't play above, [click here to view it directly](https://github.com/Joudii18/Gesture-Email-Sorter/raw/main/demo.MP4).

---

## How it works

- Move your hand to any corner of the screen and hold for 1.5 seconds to sort the current email
- 👍 Thumbs up → sign in with your Gmail account
- 👎 Thumbs down → undo the last sort

| Corner | Action |
|--------|--------|
| Top-left | Archive |
| Top-right | Mark as Important |
| Bottom-left | Trash |
| Bottom-right | Follow-up (Star) |

---

## 🛠 Tech stack

- **Frontend** — HTML, CSS, JavaScript + MediaPipe Hands
- **Backend** — Node.js + Express
- **Auth** — Google OAuth 2.0
- **API** — Gmail API v1
- **Hosting** — GitHub Pages (frontend) + any Node host (backend)

---

## Setup guide

### Prerequisites
- Node.js v18 or higher
- A Google account
- A Google Cloud account (free tier is enough — instructions below)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/Joudii18/Gesture-Email-Sorter.git
cd Gesture-Email-Sorter
npm install
```

---

### Step 2 — Google Cloud setup

This project uses the Gmail API, which requires a Google Cloud project and OAuth credentials. Follow these steps:

#### 2a — Create a Google Cloud project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **New Project**, give it a name, click **Create**

#### 2b — Enable the Gmail API
1. Go to **APIs & Services → Library**
2. Search for **Gmail API** and click **Enable**

#### 2c — Create OAuth credentials
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User type: **External**
   - Fill in app name and your email
   - Add scope: `https://www.googleapis.com/auth/gmail.modify`
   - Add your email as a test user
4. Back in Credentials, choose **Web application** as the application type
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/auth/callback
   ```
   (If deploying to a live server, also add your production URL)
6. Click **Create** and download the `credentials.json` file


---

### Step 3 — Configure your environment

Create a `.env` file in the root of the project:

```
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/callback
```

You can find `CLIENT_ID` and `CLIENT_SECRET` inside the `credentials.json` file you downloaded.

> Never commit your `.env` file or `credentials.json` to GitHub. They are already listed in `.gitignore`.

---

### Step 4 — Run locally

```bash
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in Chrome.

> **Note:** Use Chrome for best MediaPipe and camera compatibility.

---

### Step 5 — Sign in and sort

1. Click **Enable camera** and allow camera access
2. Show a 👍 thumbs up to the camera for 1 second to trigger Google sign-in
3. Complete the Google OAuth popup
4. Your real Gmail inbox will load
5. Move your hand to a corner zone and hold for 1.5 seconds to sort

---

## Deploying to a live server (optional)

If you want to share this with others, the backend needs to be hosted somewhere. The frontend (HTML file) can go on GitHub Pages, but `server.js` needs a Node.js host.

**Free options:**
- [Railway.app](https://railway.app) — connect your GitHub repo, it auto-detects Node.js
- [Render.com](https://render.com) — free tier available, no credit card required

**After deploying:**

1. Update the `SERVER` variable at the top of `index.html`:
```js
const SERVER = 'https://your-deployed-server-url.com';
```

2. Add your production URL to Google Cloud → Credentials → Authorized redirect URIs:
```
https://your-deployed-server-url.com/auth/callback
```

3. Update `REDIRECT_URI` in your server's environment variables to match.

---

## Project structure

```
gesture-email-sorter/
├── index.html        ← frontend (serve via GitHub Pages or from server)
├── server.js         ← Express backend (handles OAuth + Gmail API)
├── .env              ← your secrets (never commit this)
├── .gitignore        ← keeps .env and credentials.json out of git
└── package.json
```

---

## Security notes

- Your Gmail credentials never touch the frontend — all API calls go through the backend server
- OAuth tokens are stored in browser memory only, never in localStorage or cookies
- The `.env` file and `credentials.json` are gitignored by default

---

## Credits

- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) — real-time hand tracking
- [Gmail API](https://developers.google.com/gmail/api) — inbox access and label management
- [googleapis Node.js client](https://github.com/googleapis/google-api-nodejs-client)
