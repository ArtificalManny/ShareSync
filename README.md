ShareSync — Backend & Frontend

Branch: feature/fix-updates-endpoint
Status: Core flows stable; invites/files/tasks/roles live; moderation + realtime enabled.

Contents

Quick Start (≤10 min)

Environment

Auth model

Roles & permissions

API Reference

Projects

Invites

Files

Tasks

Updates

Activities

Users

Realtime events

Moderation & Trust/Safety

Error shapes

Postman collection (optional)

Dev notes

Quick Start (≤10 min)
1) Backend
# from /ShareSync-backend
cp .env.example .env   # edit values (Mongo, JWT, API_BASE, etc.)
npm i
npm run start:dev


Required env (example):

PORT=4000
MONGO_URI=mongodb://localhost:27017/sharesync
JWT_SECRET=dev_secret
API_BASE=http://localhost:4000/api
CLIENT_ORIGIN=http://localhost:5173

2) Frontend
# from /ShareSync-frontend-backup
cp .env.example .env   # ensure VITE_API_URL=http://localhost:4000/api
npm i
npm run dev

3) Create a user + token (dev)

Whatever auth flow you have—ensure localStorage has token in FE or pass Authorization: Bearer <jwt> in API calls.

4) Minimal smoke in cURL (Projects → Invite → Files → Tasks)
# Create a project
curl -X POST "$API_BASE/projects" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"title":"Onboarding","description":"Docs and setup"}'

# List my projects
curl -H "Authorization: Bearer $JWT" "$API_BASE/projects"

# Invite someone (email + role)
curl -X POST "$API_BASE/projects/<projectId>/invites" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"email":"teammate@example.com","role":"member"}'

# Accept invite (from accept link)
curl -X POST "$API_BASE/projects/invites/accept" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"token":"<inviteTokenFromEmail>"}'

# Upload a file (links to project)
curl -X POST "$API_BASE/files" \
 -H "Authorization: Bearer $JWT" -F "file=@/path/to/file.png" \
 -F "projectId=<projectId>"

# List files
curl -H "Authorization: Bearer $JWT" "$API_BASE/files?projectId=<projectId>"

# Create a task
curl -X POST "$API_BASE/tasks" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"projectId":"<projectId>","title":"Outline API tests"}'

# Patch a task
curl -X PATCH "$API_BASE/tasks/<taskId>" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"status":"In Progress"}'

Environment

Backend

Node 18+

NestJS + Mongoose

Socket gateway for realtime

Throttler for rate-limits

Cron for batched email notifications

Frontend

React + Vite

Route-based code-splitting

Token stored in localStorage (dev)

Auth model

Bearer JWT in Authorization header.

JwtAuthGuard protects private routes.

Public pages: /p/:token (public project), /status/:token (status snapshot).

Roles & permissions

Project members: owner | member | viewer

Stored in Project.members[] with { userId?, email?, role, addedAt }, plus legacy userId owner.

Guards:

@CanViewProject → owner/member/viewer

@CanEditProject → owner/member

@CanManageProject → owner

Applied to: projects (read/manage), tasks (create/patch), files (create/delete), invites (create/accept), updates (post), activities (list/create where applicable).

API Reference

Base: http://localhost:4000/api

Projects

POST /projects (auth)
Body:

{
  "title": "Onboarding",
  "description": "Docs and setup",
  "status": "Not Started",
  "privacy": "Private",
  "members": [{"email":"a@b.com","role":"member"}]
}


Response: full project doc with members[].

GET /projects (auth) — projects where user is owner or member.
GET /projects/quick?limit=6 (auth) — lightweight cards.
GET /projects/:id (auth + CanViewProject) — member-aware fetch.
PATCH /projects/:id/members (auth + CanManageProject)
Body:

{"members":[{"userId":"...","role":"member"},{"email":"c@d.com","role":"viewer"}]}

Invites

POST /projects/:id/invites (auth + CanManageProject)
Body:

{"email":"teammate@example.com","role":"member"}


Response:

{"ok":true,"invite":{"token":"<short>","email":"...","role":"member","expiresAt":"..." }}


POST /projects/invites/accept (auth)
Body:

{"token":"<inviteToken>"}


Effect: adds current user to project members; emits project:membersUpdated.

Files

POST /files (auth + CanEditProject) — multipart form
Fields: file (binary), projectId (string)
Response:

{"ok":true,"file":{"_id":"...","projectId":"...","url":"...","name":"...","size":123,"mime":"image/png","createdAt":"..."}}


Emits project:filesAdded.

GET /files?projectId=:id (auth + CanViewProject)
DELETE /files/:id (auth + CanEditProject)

Tasks

POST /tasks (auth + CanEditProject)
Body:

{"projectId":"<id>","title":"Outline API tests","status":"Not Started","dueDate":"2025-09-05"}


Emits tasks:created.

GET /tasks?projectId=:id (auth + CanViewProject)
PATCH /tasks/:id (auth + CanEditProject) — emits tasks:updated.

Updates

POST /projects/:id/updates (auth + CanEditProject)
Body:

{
  "text":"Shipped first pass",
  "mentions":["<userId>"],
  "files":["<fileId>"]
}


Moderation: text is checked; if allowed → emits activity:new, else pending/blocked.

Activities

POST /activities (auth + CanEditProject)
Body: { projectId, type, text?, meta? } → emits realtime, mention in-app + queued email.

GET /activities?scope=project&projectId=:id&range=7d&cursor=...&limit=20 (auth + CanViewProject)

GET /activities/export.csv?... (auth) — CSV output.

Users

GET /users/me (auth)
PATCH /users/me (auth) — e.g., { avatarUrl, avatarVersion, blurhash }
POST /uploads/avatar (auth) — accepts avatar field; runs image moderation, returns { url, thumbUrl? }.

Realtime events

Emitted over project/user rooms:

activity:new → new activity object

project:statsUpdated → { projectId }

project:membersUpdated → { projectId, members: [...] }

project:filesAdded → { projectId, files: [ ... ] }

tasks:created → { projectId, task }

tasks:updated → { projectId, task }

user:statsUpdated → { userId }

Moderation & Trust/Safety

Uploads

Virus scan + MIME/size policy.

Image checks (explicit/violent/etc. where available).

Decision: ALLOW | REVIEW | BLOCK

Response exposes moderationStatus: 'allowed' | 'pending', FE shows friendly toasts.

Text (updates)

Profanity/abuse checks; BLOCK/REVIEW/ALLOW.

If BLOCK: return { ok:false, moderation:{status:'blocked', reason} }.

If REVIEW: persist but mark pending (not broadcast).

Error shapes

Standard Nest errors:

{"statusCode":400,"message":"Bad Request"}


Moderation block:

{"ok":false,"moderation":{"status":"blocked","reason":"Violence"}}

Postman collection (optional)

Create a collection “ShareSync – Local” with an Auth variable {{token}} and Base URL {{api}} (e.g., http://localhost:4000/api).

Pre-request Script (auto-inject bearer):

pm.request.headers.add({ key: 'Authorization', value: 'Bearer ' + pm.environment.get('token') });


Useful requests to include:

POST /projects

GET /projects

POST /projects/:id/invites

POST /projects/invites/accept

POST /files (form-data)

GET /files?projectId={{pid}}

DELETE /files/:id

POST /tasks

GET /tasks?projectId={{pid}}

PATCH /tasks/:id

POST /projects/:id/updates

GET /activities?scope=project&projectId={{pid}}

Dev notes

Roles: if you mutate members, ensure the owner stays owner.

User email opt-out: User.emailOptOut = true skips digest emails; in-app still fires.

Avatar cache-bust: we append ?v=timestamp on save; UserContext broadcasts user:updated across tabs.

Frontend tokens: use bg-bg, bg-surface, border-border, text-text, text-muted consistently.
