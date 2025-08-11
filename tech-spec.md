# Learn English — Detailed Technical Specification (Final)

**Revision:** 2025-08-10  
**Prepared for:** Learn English dev & infra teams / LLM-based code generation  
**Diagram:** ER diagram file (updated): learn_english_er_diagram_updated.png  
Download: sandbox:/mnt/data/learn_english_er_diagram_updated.png

---

## Table of Contents
1. Purpose & Scope  
2. High-level architecture  
3. Data model (tables with full properties)  
4. ER Diagram reference  
5. API specification (endpoints, request/response, headers)  
6. SpeakUp WebSocket protocol (messages & lifecycle)  
7. UI: Header component — props & behavior  
8. UI pages & component responsibilities  
9. Frontend folder structure (detailed)  
10. Backend folder structure (detailed)  
11. Background workers, jobs & async processing  
12. Storage, retention & file layout (S3)  
13. Security & auth model (JWT, RBAC, WS handshake)  
14. Performance, scaling & operational notes  
15. Testing, CI/CD & developer onboarding  
16. Appendix: recommended providers, conventions, and TODOs

---

## 1. Purpose & Scope
This document is a complete, unambiguous technical specification to implement the Learn English web application (React frontend + Python backend). It is written to be parseable by developers and LLMs to generate code, infra, and tests.

Scope includes:
- User registration/auth (Google, Instagram)
- Text search & processing (vocabulary/phrase/grammar)
- SpeakUp real-time sessions (WebSocket streaming, evaluation, TTS)
- Persistent history, tutor portal, favorites & ratings
- Admin/tutor functionality and RBAC
- Production operational guidance

---

## 2. High-level architecture
- **Client (React SPA)** — UI, audio capture, WebSocket client, REST client
- **API Gateway / Backend (FastAPI recommended)** — HTTP REST endpoints + WebSocket endpoint, JWT validation
- **DB (Postgres)** — relational data, primary data store
- **Object Storage (S3)** — audio input & feedback files
- **Workers (Celery / RQ)** — STT, NLP evaluation, TTS synthesis, rating jobs
- **Cache + Pub/Sub (Redis)** — session state, streaming coordination, leader election for WS in multi-process
- **External services** — Google & Instagram OAuth, streaming STT provider (or local Whisper), TTS provider, NLP engine (OpenAI or in-house)
- **Observability** — Prometheus, Grafana, centralized logs (ELK / Datadog)

---

## 3. Data model (precise, unambiguous)

### user_details
```
id: UUID (PK)
login_type: ENUM('GOOGLE','FACEBOOK','INSTAGRAM')
name: STRING
user_email: STRING (unique, nullable)
profession: STRING (nullable)
communication_level: STRING (nullable)  # e.g., 'Beginner'
targetting: STRING (nullable)            # e.g., 'Business Communication'
mobile: STRING (nullable)
start_date: TIMESTAMP
type: ENUM('TUTOR','ADMIN','STUDENT')
plan: ENUM('FREE','PREMIUM')
status: ENUM('ACTIVE','BLOCKED')
created_at: TIMESTAMP (default now)
updated_at: TIMESTAMP (nullable)
```

**Notes**
- Indexes: `user_email` (unique), `type`, `status`.

---

### text_resources
```
id: UUID (PK)
user_id: UUID (FK -> user_details.id)  # null => generic/shared resource
type: ENUM('VOCABULARY','PHRASE','GRAMMAR')
content: TEXT                           # canonical content (word/phrase/sentence)
examples: JSON                          # array of example strings
description: TEXT                       # detailed explanation
is_favorate: BOOLEAN                    # deprecated if using user_favorites table
impressions: INT                        # incremented on view
tutor_ratings: JSON                     # [{tutor_id, rating, comment}] -> recommended to normalize
rating: INT                             # computed 0..5 via job
status: ENUM('ACTIVE','BLOCKED')
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

**Recommendation:** move `is_favorate` and `tutor_ratings` into normalized tables (`user_favorites`, `tutor_ratings`) for scaling.

---

### speak_resources
```
id: UUID (PK)
user_id: UUID (FK -> user_details.id)
status: ENUM('INITIATED','COMPLETED')
expiry: TIMESTAMP (nullable)            # optional expiry
output_resource_location: STRING       # S3 URL for TTS/feedback audio
input_resource_location: STRING        # S3 URL for uploaded raw audio
title: STRING
summary: TEXT
evaluation_result: JSON                # array of evaluation objects:
                                       # [{criteria, reference_sentence, suggestion, examples}, ...]
resource_config: JSON                  # e.g., { subject, speak_time, evaluation_criteria: [grammar, phrases, vocabulary] }
type: ENUM('SUBJECT_SPEAK','CONVERSATION')
initiated_resource: ENUM('TUTOR','STUDENT')
created_date: TIMESTAMP
completed_date: TIMESTAMP (nullable)
session_id: STRING (optional)          # link to WS session telemetry
```

---

### user_history
```
id: SERIAL (PK)
user_id: UUID (FK -> user_details.id)
action_time: TIMESTAMP
action_type: ENUM('text','speak')
user_query: TEXT
corrected_query: TEXT
corrected_description: TEXT
is_valid: BOOLEAN
reference_table: ENUM('text_resources','speak_resources')
type_of_impression: ENUM('NEW','EXISTING')
resource_id: UUID (nullable)  # FK to referenced table
created_at: TIMESTAMP
```

---

### student_tutor_mapping
```
id: SERIAL (PK)
student_id: UUID (FK -> user_details.id)
tutor_id: UUID (FK -> user_details.id)
joining_date: DATE
created_at: TIMESTAMP
```

**Constraint:** unique(student_id, tutor_id)

---

### user_favorites (recommended)
```
id: SERIAL (PK)
user_id: UUID (FK -> user_details.id)
resource_id: UUID
resource_type: ENUM('text','speak')
created_at: TIMESTAMP
```

---

### tutor_ratings (recommended)
```
id: SERIAL (PK)
tutor_id: UUID (FK -> user_details.id)
resource_id: UUID
resource_type: ENUM('text','speak')
rating: INT (1..5)
comment: TEXT (nullable)
created_at: TIMESTAMP
```

---

## 4. ER Diagram
Use: learn_english_er_diagram_updated.png  
(See file path: sandbox:/mnt/data/learn_english_er_diagram_updated.png)

Place this image in the docs next to the DB schema.

---

## 5. API specification (full)

**Auth / Common**
- All endpoints require `Authorization: Bearer <JWT>` except OAuth exchange endpoints.
- Standard headers: `Content-Type: application/json`, `Accept: application/json`, client may send `X-Request-ID` for tracing.

### Headers (precise)
```
# Required in most HTTP requests:
Authorization: Bearer <JWT>      # JWT signed by backend auth service
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>            # optional for tracing

# WebSocket handshake (query or header):
# Option A (query param)
wss://api.example.com/ws/speak?token=<JWT>&session_id=<session_id>
# Option B (header)
Sec-WebSocket-Protocol: "jwt,<base64token>"  # or custom header
```

**Token claims (JWT)** (must include)
```
{
  "sub": "<user_id>",
  "email": "<user_email>",
  "role": "STUDENT|TUTOR|ADMIN",
  "iat": <int>,
  "exp": <int>
}
```

---

### Auth endpoints
```
POST /auth/google
  - Exchange Google OAuth code or token for app JWT.
  - Body: { "code": "..."} or { "id_token": "..." }
  - Response: { "access_token": "<JWT>", "expires_in": 3600, "user": { user_details } }

POST /auth/instagram
  - Similar flow.
```

**Note:** implement token verification, optional refresh tokens (rotate refresh tokens), and store minimal session metadata.

---

### Text processing & search
- `POST /api/process-text`
  - Purpose: canonicalize a user query (detect type, normalize, correct, produce best-match resource or generate explanation)
  - Request:
  ```
  {
    "query": "string",
    "user_id": "uuid",           # optional (from token normally)
    "context": { }              # optional
  }
  ```
  - Response:
  ```
  {
    "detected_type": "VOCABULARY|PHRASE|GRAMMAR",
    "corrected_query": "string",
    "description": "string",
    "examples": ["..."],
    "resource_id": "uuid or null",
    "recommendations": [ { resource_id, reason } ]
  }
  ```

- `GET /api/search?type=<SPEAK|TEXT>&sub_type=<VOCABULARY|PHRASE|GRAMMAR>&order_by=<rating|recent>&limit=20&next_page_id=<cursor>&target_user_id=<uuid>`
  - Pagination: cursor-based `next_page_id`
  - If `target_user_id` present, must be allowed for tutor/admin and student must belong to tutor.

Response format:
```
{
  "items":[
    {
      "user_id":"uuid",
      "type":"TEXT|SPEAK",
      "details": { ... resource-specific fields ... },
      "query":"string",
      "valid": true
    }
  ],
  "next_page_id":"cursor"
}
```

---

### SpeakUp (WebSocket) — real-time protocol (preferred)
**WS URL:** `wss://api.example.com/ws/speak?token=<JWT>` or `wss://api.example.com/ws/speak/<session_id>?token=<JWT>`

**Handshake**
- Validate JWT, throttle checks, session creation if not existing.

**Client → Server messages**
- `start` (JSON): begin session
  ```
  { "type":"start", "session_id":"<optional>", "config": { "subject":"string", "speak_time":60, "type":"SUBJECT_SPEAK" } }
  ```
- `audio_chunk` (binary) — raw PCM frames or encoded (agreed format); may be sent as binary frames. If using JSON base64:
  ```
  { "type":"audio", "sequence": 1, "payload_b64":"..." }
  ```
- `stop` (JSON): signal to finalize
  ```
  { "type":"stop", "session_id":"..." }
  ```
- `ping` (JSON): keepalive (optional)

**Server → Client messages**
- `ack`:
  ```
  { "type":"ack", "session_id":"...", "max_duration": 120 }
  ```
- `interim_transcript`:
  ```
  { "type":"interim", "transcript":"partial text", "confidence":0.8, "time": 12 }
  ```
- `processing`: server indicates evaluation started
  ```
  { "type":"processing", "session_id":"..." }
  ```
- `final`: final evaluation results + links
  ```
  {
    "type":"final",
    "session_id":"...",
    "evaluation_result":[ { "criteria":"grammar", "reference_sentence":"...", "suggestion":"..." } ],
    "transcript":"final transcript",
    "tts_url":"https://s3.../feedback.mp3",
    "resource_id":"uuid"
  }
  ```
- `error`:
  ```
  { "type":"error", "code": 400, "message":"..." }
  ```

**Binary audio:** For performance, prefer binary frames (raw PCM or Opus). Server must support chosen encoding and forward to STT provider or run local STT.

**WebSocket lifecycle rules**
- Client sends `start` first.
- Server responds `ack`.
- Client streams audio.
- Client sends `stop` or session auto-stops at `speak_time`.
- Server responds `processing` then `final`.
- After `final`, server closes session or keeps it for retrieval.

**Fallback HTTP flow**
- `POST /api/speakup/upload` — client uploads full audio if WS not supported. Returns job id; results polled or pushed via SSE.

---

### SpeakUp REST (for retrieval)
- `GET /api/speakup/{id}` — fetch speak resource details, evaluation_result, urls.

Response:
```
{
  "id":"uuid",
  "status":"COMPLETED",
  "evaluation_result":[ ... ],
  "input_resource_location":"s3://..",
  "output_resource_location":"s3://..",
  "summary":".."
}
```

---

### Tutor endpoints
- `GET /api/tutor/students` — list of students for current tutor
- `GET /api/tutor/student/{id}?from=&to=&limit=` — student details + activities
- `GET /api/tutor/recommendation/{user_id}` — recommended `text_resources` for the user

Response shapes are standard JSON objects with arrays, paginated.

---

### Favorites & Feedback
- `POST /api/favorites` — `{ user_id, resource_id, resource_type }`
- `POST /api/feedback` — `{ tutor_id, student_id, speak_resource_id, feedback_text }`

---

## 6. SpeakUp WebSocket sequence (end-to-end)
1. User clicks "Start speak" → UI posts create session (optional) → receives `session_id`, `ws_url`
2. Client connects WS with `token` → server validates → sends `ack`
3. Client streams audio frames; server emits `interim` transcripts
4. User clicks `Stop` → client sends `stop`
5. Server processes final STT, runs evaluation (NLP rules + possibly ASR confidence + pronunciation scoring)
6. Worker synthesizes TTS feedback and stores in S3
7. Server sends `final` message with `evaluation_result` + `tts_url`
8. Backend persists `speak_resources` and `user_history`, notifies tutor if assignment

---

## 7. UI: Header component — precise properties & behaviors

**Component name:** `AppHeader`

**Purpose:** top-level header, global navigation, search entry point, user menu & quick actions.

**Props** (explicit)
```
{
  "logo": { "src": "string", "alt": "string" },
  "showSearch": boolean,           # true on pages with search
  "onSearch": function(query):Promise, 
  "showSpeak": boolean,            # show speak icon/button
  "onSpeakClick": function(), 
  "user": { "id":"uuid", "name":"string", "avatarUrl":"string", "role":"STUDENT|TUTOR|ADMIN" },
  "onLogout": function(),
  "onAssignments": function(),
  "onHistory": function(),
  "notifications": [ {id, type, message, read} ],
  "responsiveBreakpoints": { mobile: 768 }
}
```

**Stateful behavior**
- Renders hamburger menu on small screens.
- Search input: debounced; returns results via `onSearch`.
- Speak button opens Speak page modal.
- Avatar click opens dropdown: Profile, Assignments, History, Logout.
- Shows unread assignments badge (if user.role === 'TUTOR' show assignment count).
- Accessibility: aria-labels for buttons, keyboard navigation, focus traps for modals.

**Events**
- `onSearch(query)` → called after debounce
- `onSpeakClick()` → navigates to Speak page/modal
- `onProfile()` → opens profile page
- `onLogout()` → clears token & calls backend logout (if any)

---

## 8. UI pages & components (mapping to routes)
- `/login` — social auth flows + onboarding questions
- `/home` — AppHeader + SearchBar + CardsGrid + HistoryWidgets
- `/speak` — Speak dashboard: Start speak, Active sessions, Completed sessions
- `/speak/:id` — speak evaluation detail
- `/tutor` — tutor dashboard (students list)
- `/tutor/student/:id` — full student activity & feedback
- `/profile` — user profile & settings
- Global components:
  - `SearchBar`, `Card`, `ModalDetail`, `SpeakSession`, `WSClient`, `HistoryList`, `PaginationCursor`

---

## 9. Frontend folder structure (granular with file-level intent)
```
learn-english-frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── assets/                 # images, icons, fonts
│   ├── components/
│   │   ├── AppHeader/
│   │   │   ├── AppHeader.jsx
│   │   │   └── AppHeader.test.jsx
│   │   ├── SearchBar/
│   │   │   └── SearchBar.jsx
│   │   ├── Card/
│   │   │   └── Card.jsx
│   │   ├── ModalDetail/
│   │   │   └── ModalDetail.jsx
│   │   └── Speak/
│   │       ├── SpeakPage.jsx
│   │       ├── SpeakSession.jsx
│   │       ├── WSClient.js        # WS wrapper + reconnection + message parser
│   │       └── MediaRecorderHook.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Speak.jsx
│   │   └── TutorPortal/
│   │       ├── StudentsList.jsx
│   │       └── StudentDetail.jsx
│   ├── services/
│   │   ├── api.js                 # axios instance, interceptors (JWT refresh)
│   │   ├── auth.js
│   │   └── speakService.js
│   ├── store/                     # Redux / Zustand / Context
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   ├── App.jsx
│   └── index.jsx
├── .env
├── package.json
└── README.md
```

**Notes**
- `WSClient.js` must support: binary frames for audio, JSON message parsing, reconnection backoff, heartbeats, and expose events: onAck, onInterim, onFinal, onError.
- Tests: unit tests for components, integration tests for WS flows (msw + fake STT)

---

## 10. Backend folder structure (detailed)

Use FastAPI + SQLAlchemy + Alembic + Celery

```
learn-english-backend/
├── app/
│   ├── main.py                    # FastAPI app instantiation, include routers, WS route registration
│   ├── core/
│   │   ├── config.py               # env config, secrets
│   │   └── security.py             # JWT creation + verification utilities
│   ├── api/                        # HTTP endpoints
│   │   ├── auth.py
│   │   ├── text.py                 # process-text, search
│   │   ├── speak.py                # REST speak endpoints (create, fetch)
│   │   ├── tutor.py
│   │   └── history.py
│   ├── ws/                         # WebSocket handlers
│   │   └── speak_ws.py             # wss /ws/speak handler
│   ├── services/                   # business logic
│   │   ├── stt_service.py          # integrate streaming STT provider
│   │   ├── nlp_service.py          # grammar/vocab analysis
│   │   ├── tts_service.py          # generate feedback audio
│   │   └── rating_job.py
│   ├── models/                     # SQLAlchemy models (tables described above)
│   │   └── models.py
│   ├── schemas/                    # Pydantic schemas for validation
│   ├── db/
│   │   ├── session.py              # DB session factory
│   │   └── alembic/                # migrations
│   ├── workers/
│   │   ├── celery_app.py
│   │   └── tasks.py                # async tasks: process audio, compute rating
│   ├── utils/
│   └── tests/
├── docker/
│   └── Dockerfile
├── requirements.txt
└── README.md
```

**Implementation notes**
- `speak_ws.py` must offload heavy processing to workers; keep WebSocket connection responsive.
- Keep minimal blocking logic in request handlers.
- Use `async` everywhere for I/O.

---

## 11. Background workers & scheduled jobs
- **AudioProcessor** (Celery task): receives job with `s3_input_key`, runs STT, calls `nlp_service` for evaluation, stores `evaluation_result`, triggers TTS generation, updates `speak_resources`.
- **RatingCalculator** (daily scheduled): computes score for `text_resources.rating` using:
  - weight_recent_pickups (40%)
  - tutor_avg_rating (40%)
  - impressions_count (20%)
  - (weights configurable)
- **ImpressionSync**: if impressions incremented in Redis for performance, batch-sync to Postgres every minute.
- **NotificationJob**: notify tutors of new completed sessions or pending assignments.

---

## 12. Storage & retention
- **Audio files** stored in S3. Keys:
  - `speak/input/<user_id>/<yyyy>/<mm>/<dd>/<uuid>-input.wav`
  - `speak/output/<user_id>/<yyyy>/<mm>/<dd>/<uuid>-feedback.mp3`
- **Retention policy (example)**:
  - Raw input audio: 90 days
  - Feedback audio: 365 days
  - Option to purge on user delete
- **Access control**: store S3 keys in DB and serve via pre-signed URLs (short-lived).

---

## 13. Security & auth model

**Auth flow**
- OAuth social login → backend verifies provider token → create or update `user_details` → issue JWT
- JWT expiry: access token short (1h), refresh token long (7-30 days)
- Store refresh tokens hashed in DB if refresh flow used.

**RBAC**
- Roles: STUDENT, TUTOR, ADMIN
- JWT claim `role` used to gate endpoints
- Verify `target_user_id` queries against `student_tutor_mapping` for tutors.

**WebSocket security**
- Verify JWT on handshake
- Option: issue ephemeral session token via `POST /api/speakup/create` and use it as WS token
- Enforce per-user concurrency and rate limits

**Input validation**
- Use Pydantic schemas
- Sanitize any HTML/text content
- Validate audio encoding & max size (e.g., 10 MB per minute limit)

**Data privacy**
- Provide endpoint for user data deletion (`DELETE /api/user/{id}`) — cascade or anonymize audio & history per retention rules.

---

## 14. Performance, scaling & operational notes

**Performance targets**
- Text processing latency: < 3s median
- Speak final evaluation latency: < 8s for small sessions (depends on STT provider)
- Support concurrency of 500+ active users (design target)

**Scaling**
- Stateless API servers behind load balancer
- Scale WebSocket servers horizontally with Redis-based session routing
- Workers autoscaled based on queue length
- Postgres scaled vertically, read replicas for analytics

**Monitoring**
- Track metrics: requests/sec, WS connections, STT latency, queue length, job failures
- Logs: structured JSON logs with `X-Request-ID`
- Health endpoints: `/healthz`, `/metrics`

---

## 15. Testing, CI/CD & developer onboarding

**Testing**
- Unit tests for services (pytest)
- Integration tests: API endpoints using TestClient (FastAPI)
- E2E tests: frontend with Playwright/Cypress (simulate WS interactions with mocked STT)
- Load testing: simulate concurrent speak sessions (k6)

**CI**
- Lint (flake8/black), unit tests, build docker images, run security scan
- Deploy to staging on merge to `main` with GitHub Actions / GitLab CI

**Developer local setup (commands)**
```
# Backend (example)
git clone ...
cd learn-english-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set DB and S3 local or dev credentials
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd learn-english-frontend
npm install
cp .env.example .env
npm run dev
```

**Note:** exact env variables listed in `.env.example` (DB_URL, REDIS_URL, S3_BUCKET, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, JWT_SECRET)

---

## 16. Appendix: provider recommendations & TODOs

**Provider options**
- STT: Google Cloud Speech-to-Text (streaming), Azure Speech, or OpenAI/Whisper (self-host for cost savings)
- TTS: Amazon Polly or Google TTS (SSML support)
- NLP: OpenAI (chat/completion) for rich feedback OR spaCy + rule-based grammar checks for deterministic behavior

**TODO / decisions needed**
- Confirm initial social providers (Google + Instagram or include Facebook)
- Confirm retention durations
- Decide between GraphQL vs REST for Collections API
- Finalize STT/TTS providers (cost impact)

---

## 17. Deliverables I can produce next (pick)
- OpenAPI (Swagger) spec for HTTP endpoints (JSON/YAML)
- GraphQL schema for collections & tutor queries
- SpeakUp sequence diagram (SVG or PNG)
- Backend scaffold (FastAPI + WS handler + Celery task outline)
- Frontend scaffold (React pages & WS client)
- Terraform / Kubernetes manifest for deployment

---

### End of document