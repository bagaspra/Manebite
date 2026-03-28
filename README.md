# 影 Manebite

**Learn Japanese by shadowing native speakers — one sentence at a time.**

Manebite lets you practice Japanese the way language learners swear by: shadowing. You listen to a native speaker, then you repeat. No textbooks, no flashcards — just you and real Japanese audio.

---

## Tools

### Shadowing Queue

Paste any Japanese YouTube video URL → Manebite extracts every sentence from the subtitles → you shadow them one by one at your own pace.

**How to use it:**

1. **Add a video** — Paste a YouTube URL of any Japanese video with subtitles. Podcasts, news segments, vlogs, dramas — anything with Japanese captions works.
2. **Open the session** — Click **Shadow →** on any video.
3. **Shadow sentence by sentence** — Each sentence plays one at a time. Listen, then repeat out loud.

**Playback modes** (press **L** to cycle):

| Mode | Behavior |
|------|----------|
| **↺ Loop** | Replays the current sentence on loop until you press Next |
| **→ Follow** | Video plays freely; the sentence display follows along automatically |
| **⏸ Step** | Video pauses at the end of each sentence — press Next to continue |

**Keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `Space` | Play / pause |
| `N` or `→` | Next sentence |
| `P` or `←` | Previous sentence |
| `L` | Cycle playback mode (Loop → Follow → Step) |
| `R` | Toggle rōmaji |

**Word lookup** — Select any word in the sentence to instantly see its reading and meaning, without leaving the page.

**Progress tracking** — Sign in to save your progress. Come back anytime and resume exactly where you left off.

**Public Library** — Browse videos shared by other users, ready to shadow.

---

### Keigo Translator

Convert text into proper Japanese formal language — or check how formal your Japanese actually is.

- Paste English, Indonesian, or casual Japanese → get a formal Japanese translation
- Identifies keigo levels used: teineigo (polite), sonkeigo (respectful), kenjougo (humble)
- Saves your translation history (local for guests, synced to account on sign-in)
- Guests get 3 free translations before sign-in is required

Powered by Google Gemini.

---

## Running locally

### Prerequisites

- Docker & Docker Compose
- A Google OAuth app (Client ID + Secret)
- A Gemini API key

### Setup

**1. Backend**

Copy `backend/.env.example` to `backend/.env` and fill in:

```
DATABASE_URL=postgresql+asyncpg://shadowing:shadowing@postgres:5432/shadowing_queue
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
```

**2. Frontend**

Copy `frontend/.env.example` to `frontend/.env` and fill in:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=      # generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**3. Start**

```bash
docker compose up
```

App is available at `http://localhost:3000`.

---

## Built with

- **Frontend** — Next.js 15, React 19, NextAuth v5, Tailwind CSS
- **Backend** — FastAPI, SQLAlchemy 2 (async), PostgreSQL 16
- **Subtitle extraction** — yt-dlp
- **Romaji conversion** — pykakasi
- **Keigo translation** — Google Gemini API
- **Deployment** — Docker Compose, AWS
