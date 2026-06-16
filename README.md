# Vyasa — Smart Meeting & Work Summary Assistant

> Paste messy notes. Get polished, professional outputs. Vyasa turns unstructured
> meeting notes and work logs into clean summaries, action items, emails, and status
> reports using your favorite LLM — with an Apple-inspired dark, glass UI.

<p>
  <img alt="Python" src="https://img.shields.io/badge/python-3.9%2B-3776AB?logo=python&logoColor=white">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-9b59b6">
</p>

---

## Table of contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Quick start](#quick-start)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [LLM providers](#llm-providers)
- [API endpoints](#api-endpoints)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Sample prompts](#sample-prompts)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Screenshots

> **Note:** the images below are placeholders. Drop your own PNG captures into
> [`docs/screenshots/`](docs/screenshots) using the same file names and they will render
> automatically.

| Meeting Summary | Email Generator |
| :---: | :---: |
| ![Meeting Summary](docs/screenshots/meeting-summary.png) | ![Email Generator](docs/screenshots/email-generator.png) |

| Status Reports | Weekly Reports |
| :---: | :---: |
| ![Status Reports](docs/screenshots/status-reports.png) | ![Weekly Reports](docs/screenshots/weekly-reports.png) |

| Settings |
| :---: |
| ![Settings](docs/screenshots/settings.png) |

---

## Features

- **Five focused workspaces.** A clean left sidebar switches between purpose-built tools —
  no clutter, no mode confusion. Each workspace has its own large input, a primary
  **Generate** button, a **Clear** button, and renders only the output cards relevant to it.
  - 📝 **Meeting Summary** — Summary, Action Items, Risks & Blockers, Dependencies, Next Steps
  - ✉️ **Email Generator** — tone selector (Professional / Friendly / Executive / Concise)
    plus a polished email draft (subject + body)
  - 📋 **Status Reports** — Completed, In Progress, Upcoming (daily standup ready)
  - 🗓️ **Weekly Reports** — Accomplishments, Challenges, Pending, Next Week Priorities
  - ⚙️ **Settings** — provider, API key, and model, saved to your browser's `localStorage`
- **Bring your own LLM.** Works with any OpenAI-compatible API. **Groq is the default**
  (fast and free to start), with built-in support for OpenAI, Gemini, and Claude.
- **Structured, copy-ready output.** Every result is rendered as a frosted-glass card with
  GitHub-flavored Markdown, a one-click **Copy** button, and an expand/collapse toggle.
- **Live streaming.** Toggle **Stream responses** in Settings to watch output appear
  token-by-token as it's written (Server-Sent Events), then settle into structured cards.
- **One-click connection test.** A **Test Connection** button in Settings validates your
  provider + key with a zero-cost check before you generate anything.
- **History.** Every generation is saved to your browser and listed in a slide-in
  **History** panel — restore any past result (input, tone, and output) in one click.
- **Export & shortcuts.** **Copy all** or **Export as Markdown** (`.md`) any result,
  **Regenerate** with one click, and press **⌘/Ctrl + Enter** to generate from the input.
- **Keys stay local.** Your API key and provider live in the browser via the Settings page
  and are sent only to your chosen provider. No database, no auth, no telemetry.
  The backend can also fall back to server-side environment variables.
- **Apple-inspired design.** Deep charcoal background, frosted glass surfaces, blue→purple
  gradient accents, soft shadows, large rounded corners, and slow, smooth Framer Motion.
- **Runs entirely locally.** A FastAPI backend and a Vite/React frontend — start both with a
  couple of commands.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3, Framer Motion 11, lucide-react, react-markdown + remark-gfm, clsx |
| Backend | FastAPI, Uvicorn, Pydantic v2, pydantic-settings, python-dotenv |
| LLM client | `openai` Python SDK (`AsyncOpenAI`), pointed at any OpenAI-compatible base URL |
| Providers | Groq (default), OpenAI, Gemini, Claude |
| Tooling | TypeScript strict mode, `@tailwindcss/typography` |

---

## Architecture

Vyasa is a thin, well-typed shell around a provider-agnostic LLM service. The frontend
collects notes and settings, posts them to FastAPI, which builds carefully engineered
prompts, calls the selected provider through the OpenAI-compatible client, extracts a
single structured JSON object, and returns it as a typed response that the UI renders as
cards.

```
Frontend (React)  →  FastAPI router  →  LLM service  →  Provider API
                                            ↓
                                  structured JSON  →  typed response  →  output cards
```

For the full data-flow diagram, component responsibilities, all four request/response
shapes, the provider abstraction, and the error-handling flow, see
**[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Quick start

You'll run two processes: the **backend** (FastAPI on port `8000`) and the **frontend**
(Vite on port `5173`). Open two terminals.

> You only need **one** API key to get started — a free **Groq** key works great.
> You can either put it in the backend's `.env` **or** paste it into the in-app
> **Settings** page at runtime (no `.env` needed). See [Settings, no .env](#settings-no-env).

### Backend

Requires **Python 3.9+**.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then open .env and add your Groq key (GROQ_API_KEY=...)
uvicorn main:app --reload
```

The API is now live at **http://localhost:8000**. Visit
[http://localhost:8000/health](http://localhost:8000/health) to confirm it returns
`{"status":"ok"}`, or [http://localhost:8000/docs](http://localhost:8000/docs) for the
interactive Swagger UI.

> On Windows, activate the virtual environment with `.\.venv\Scripts\activate` instead of
> `source .venv/bin/activate`.

### Frontend

Requires **Node.js 18+**.

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

By default the frontend talks to the backend at `http://localhost:8000`. To point it
elsewhere, copy `frontend/.env.example` to `frontend/.env` and set
`VITE_API_BASE_URL`.

### Settings, no .env

Prefer not to touch the backend `.env`? Start both servers, open the app, go to
**⚙️ Settings**, choose your **provider**, paste your **API key**, optionally set a
**model**, and click **Save**. Your settings are stored in `localStorage` (key
`vyasa.settings`) and sent with each request. The backend only falls back to its
environment variables when a request omits the key.

---

## LLM providers

Vyasa speaks the OpenAI chat-completions protocol, so it works with any
OpenAI-compatible endpoint. The four built-in providers:

| Provider | `id` | Default model | Base URL | API key env var | JSON mode | Get a key |
| --- | --- | --- | --- | --- | :---: | --- |
| **Groq** _(default)_ | `groq` | `llama-3.3-70b-versatile` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` | ✅ | **Free** → [console.groq.com/keys](https://console.groq.com/keys) |
| OpenAI | `openai` | `gpt-4o-mini` | `https://api.openai.com/v1` | `OPENAI_API_KEY` | ✅ | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Gemini | `gemini` | `gemini-2.0-flash` | `https://generativelanguage.googleapis.com/v1beta/openai/` | `GEMINI_API_KEY` | ✅ | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Claude | `claude` | `claude-sonnet-4-6` | `https://api.anthropic.com/v1/` | `ANTHROPIC_API_KEY` | ❌ | [console.anthropic.com](https://console.anthropic.com) |

**Defaults:** `DEFAULT_PROVIDER=groq`. When a request omits a model, Vyasa uses the
provider's optional model override (e.g. `GROQ_MODEL`) if set, otherwise the default model
above. Providers with `supports_json_mode = true` are called with
`response_format={"type":"json_object"}`; Claude relies on prompt-enforced JSON plus a
robust extractor.

> 💡 **New here?** Grab a free key at
> [console.groq.com/keys](https://console.groq.com/keys), keep `DEFAULT_PROVIDER=groq`, and
> you're ready to go.

---

## API endpoints

Base URL: `http://localhost:8000`

| Method | Path | Request body | Response model | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/` | — | `{ name, status, providers }` | Service info + provider id list |
| `GET` | `/health` | — | `{ status: "ok" }` | Liveness check |
| `GET` | `/providers` | — | `[{ id, default_model, supports_json_mode }]` | Provider metadata for the Settings UI (no secrets) |
| `POST` | `/generate-summary` | `SummaryRequest` | `SummaryResponse` | Meeting summary, action items, risks, dependencies, next steps |
| `POST` | `/generate-email` | `EmailRequest` | `EmailResponse` | Email subject + body in the selected tone |
| `POST` | `/generate-daily-report` | `DailyReportRequest` | `DailyReportResponse` | Daily status report |
| `POST` | `/generate-weekly-report` | `WeeklyReportRequest` | `WeeklyReportResponse` | Weekly report |
| `POST` | `/generate/stream` | `StreamRequest` | `text/event-stream` (SSE) | Streamed Markdown for any `kind`, parsed into the same cards |
| `POST` | `/validate-key` | `ValidateRequest` | `ValidateResponse` | Zero-cost provider/key check (used by **Test Connection**) |

**Shared request fields** (every generation `POST` body): `text` (required, non-empty), and
optional `provider`, `api_key`, `model`. The email endpoint additionally accepts `tone`
(`professional` | `friendly` | `executive` | `concise`, default `professional`).

**Streaming** — `POST /generate/stream` takes `{ kind, text, tone?, provider?, api_key?, model? }`
where `kind` is `summary` | `email` | `daily` | `weekly`. It returns Server-Sent Events:
`data: {"delta":"..."}` frames, terminated by `data: [DONE]`, with failures surfaced as an
`event: error` frame. The frontend accumulates the Markdown and splits it back into the same
result keys as the non-streaming endpoints. Credential/provider errors still fail fast with a
normal HTTP status before the stream starts.

**Validation** — `POST /validate-key` takes `{ provider?, api_key?, model? }` and returns
`{ ok, provider, model, detail }`; invalid credentials map to the same error `code`s below.

**Response JSON keys**

| Endpoint | Keys |
| --- | --- |
| `/generate-summary` | `summary`, `action_items`, `risks`, `dependencies`, `next_steps` |
| `/generate-email` | `subject`, `email` |
| `/generate-daily-report` | `completed`, `in_progress`, `upcoming` |
| `/generate-weekly-report` | `accomplishments`, `challenges`, `pending`, `next_week_priorities` |

Every value is a GitHub-flavored Markdown string (empty `""` when a section has no content).

**Error responses** are shaped like `ErrorResponse`:
`{ "error": string, "detail": string, "code": string }`.

| HTTP status | `code` | Cause |
| --- | --- | --- |
| `400` | `missing_api_key` | No API key in the request or environment |
| `400` | `bad_request` | Unknown provider id |
| `401` | `auth_error` | Provider rejected the API key |
| `429` | `rate_limit` | Provider rate limit hit |
| `502` | `provider_error` | Upstream failure or unparseable JSON |

**Example request**

```bash
curl -X POST http://localhost:8000/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
        "text": "Standup: shipped login fix, blocked on SSO cert, demo Friday.",
        "provider": "groq",
        "api_key": "gsk_your_key_here"
      }'
```

```jsonc
{
  "summary": "The team shipped the login fix and is preparing a Friday demo...",
  "action_items": "- **Obtain SSO certificate** to unblock single sign-on",
  "risks": "- **SSO cert dependency** could slip the demo",
  "dependencies": "- SSO certificate from the security team",
  "next_steps": "- Confirm demo agenda for Friday"
}
```

---

## Environment variables

### Backend (`backend/.env`, see `backend/.env.example`)

| Variable | Default | Description |
| --- | --- | --- |
| `DEFAULT_PROVIDER` | `groq` | Provider used when a request omits `provider`. One of `groq` \| `openai` \| `gemini` \| `claude` |
| `GROQ_API_KEY` | _(empty)_ | Groq API key — [get a free one](https://console.groq.com/keys) |
| `OPENAI_API_KEY` | _(empty)_ | OpenAI API key |
| `GEMINI_API_KEY` | _(empty)_ | Google Gemini API key |
| `ANTHROPIC_API_KEY` | _(empty)_ | Anthropic (Claude) API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Optional Groq model override |
| `OPENAI_MODEL` | `gpt-4o-mini` | Optional OpenAI model override |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Optional Gemini model override |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Optional Claude model override |
| `FRONTEND_ORIGINS` | `*` | Comma-separated CORS origins (`*` allows any during local dev) |
| `REQUEST_TIMEOUT` | `60` | Per-request LLM timeout, in seconds |

> Variable names are case-insensitive. You don't need to set every key — set the one for
> the provider you intend to use. Any of these can be supplied per-request from the
> Settings page instead.

### Frontend (`frontend/.env`, see `frontend/.env.example`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

---

## Project structure

```
Vyasa/
├── README.md
├── ARCHITECTURE.md
├── .gitignore
├── docs/
│   ├── sample-prompts.md           # internal prompt templates + example I/O
│   └── screenshots/                # place your PNG captures here
│       └── .gitkeep
├── backend/                        # FastAPI app (run from this dir)
│   ├── main.py                     # app, CORS, /, /health, /providers, router mount
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py             # PROVIDERS registry, Settings, resolve_provider_config
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py              # request/response Pydantic models
│   ├── prompts/
│   │   ├── __init__.py
│   │   └── templates.py            # JSON + streaming prompt builders, KEYS / STREAM_HEADERS
│   ├── routers/
│   │   ├── __init__.py
│   │   └── generate.py             # generate / stream / validate-key endpoints + error mapping
│   └── services/
│       ├── __init__.py
│       └── llm_service.py          # generate_structured, stream_generate, validate_credentials
└── frontend/                       # React + Vite app (run from this dir)
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    ├── .gitignore
    └── src/
        ├── main.tsx                # React 18 entry
        ├── App.tsx                 # view switching + Layout
        ├── index.css               # Tailwind + base design system
        ├── vite-env.d.ts
        ├── types/index.ts          # shared types + ApiError
        ├── services/api.ts         # typed fetch wrappers
        ├── lib/                    # motion variants, sections (parse/build/stream), download, time
        ├── hooks/                  # useLocalStorage, useSettings, useGenerator, useClipboard, useHistory, useToast
        ├── components/             # Background, Sidebar, GlassCard, OutputCard, HistoryPanel, StreamingView, ResultToolbar, KeyNotice, ...
        └── pages/                  # one page per workspace
```

---

## Sample prompts

Curious how the structured output is produced? The exact internal system/user prompt
templates for all four generators — with their output keys, the IAM meeting example
input, and example JSON outputs — are documented in
**[docs/sample-prompts.md](docs/sample-prompts.md)**.

---

## Troubleshooting

**CORS errors in the browser console (`blocked by CORS policy`).**
The backend allows origins from `FRONTEND_ORIGINS`. For local dev keep it as `*` (the
default), or set it to your exact frontend origin, e.g.
`FRONTEND_ORIGINS=http://localhost:5173`. Restart the backend after changing `.env`.
Note: when `FRONTEND_ORIGINS=*`, credentials are disabled by design.

**`400 missing_api_key`.**
No key was found in the request or the environment. Either add the relevant key to
`backend/.env` (e.g. `GROQ_API_KEY=...`) and restart `uvicorn`, or paste a key into the
in-app **Settings** page. Make sure the key matches the **provider** you selected.

**`401 auth_error`.**
The provider rejected your key. Double-check you copied the full key, that it belongs to
the selected provider, and that it hasn't expired or been revoked.

**`429 rate_limit`.**
You've hit your provider's rate limit. Wait a moment and retry, switch to a different
provider in **Settings**, or upgrade your provider plan. Groq's free tier is generous but
not unlimited.

**`502 provider_error`.**
The upstream provider failed or returned output that couldn't be parsed as JSON. Retry —
this is usually transient. If it persists, try a different model or provider in
**Settings**.

**"Could not reach the server."**
The frontend can't reach the backend. Confirm `uvicorn` is running on port `8000`, that
[http://localhost:8000/health](http://localhost:8000/health) responds, and that
`VITE_API_BASE_URL` points to the right address.

**Frontend won't start / type errors.**
Run `npm install` in `frontend/`. To type-check without building, run `npm run lint`
(`tsc --noEmit`). The project uses strict TypeScript with no unused locals/parameters.

**Wrong model is being used.**
Resolution order is: the model in the request (Settings page) → the provider's
`*_MODEL` env override → the provider's built-in default. Clear the Settings **Model**
field to fall back to the default.

---

## License

MIT. Built as a production-quality portfolio app.
