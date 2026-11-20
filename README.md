# KIDZONICS ADMIN – SYSTEM MANAGEMENT

A **separate Base44 application** for school administrators. It has its own
deployment URL, login, navigation and access rules, and it is not part of the
KidZonics Student/Teacher application. The main app has no admin page, route,
link or role option.

```
 KIDZONICS MAIN SYSTEM (Base44 app #1)          KIDZONICS ADMIN (Base44 app #2)
 Student Portal · Teacher Portal                 Admin login · Dashboard · Management
        │  teacher functions                             │  browser → "admin" function only
        ▼                                                ▼
 ┌──────────────────────────┐   signed HTTPS   ┌──────────────────────────────┐
 │ adminApi function        │◄─────────────────│ admin function (proxy)       │
 │ • checks HMAC signature, │  ADMIN_API_SECRET │ • signed in to app #2?       │
 │   time window, one-time  │                  │ • role == admin?             │
 │   nonce                  │                  │ • allowed action?            │
 │ • validates every input  │                  │ • signs request (server)     │
 │ • writes AdminActivityLog│                  └──────────────────────────────┘
 └──────────┬───────────────┘
            ▼
   One authoritative database (app #1): Students, Teachers, RFID cards,
   lessons, assessments, support requests, activity logs.
```

**Why it's built this way.** Two Base44 projects do **not** share logins,
databases or permissions. So all school records stay in the main app (one source
of truth, no duplicates). The Admin app keeps only its own administrator
accounts. It reaches the records through one signed server-to-server API. The
shared secret lives only in both apps' Base44 **Secrets**, never in browser
code.

## What has to be set up by hand

None of this can be done from code. Until it's done, the Admin app shows
"The link to the KidZonics main system is not configured".

1. **Create the second Base44 project.** In Base44, create a new app named
   `KIDZONICS ADMIN – SYSTEM MANAGEMENT`. Connect it to its own GitHub
   repository containing this `kidzonics-admin` folder, as the repository root.
   Then link it locally:

   ```bash
   base44 link
   ```

2. **Make the Admin app invite-only.** In the Admin app's Base44 settings, turn
   off public sign-up / make the app private. Then invite each administrator
   with the **admin** role (Users → Invite). An account without the admin role
   is refused by the server even if it can sign in. To require two-step
   verification, set the MFA policy to *required*. Administrators can also turn
   it on themselves under Settings → Two-step verification.

3. **Generate one shared secret** (at least 32 characters):

   ```bash
   openssl rand -base64 48
   ```

4. **Add secrets to the MAIN app** (Base44 → main app → Settings → Secrets):

   | Name | Value |
   |---|---|
   | `ADMIN_API_SECRET` | the secret from step 3 |

5. **Add secrets to the ADMIN app:**

   | Name | Value |
   |---|---|
   | `ADMIN_API_SECRET` | the same secret |
   | `MAIN_ADMIN_API_URL` | `https://base44.app/api/apps/<MAIN_APP_ID>/functions/adminApi`, where `<MAIN_APP_ID>` is the main app's id from its Builder URL. If Base44 shows a different URL for the function, use that one. |
   | `ADMIN_ALLOWED_EMAILS` | *optional:* comma-separated administrator emails, as a second check on top of the admin role |

6. **Push and publish both apps** from their Base44 dashboards: the main app
   first, because it has new entities and functions, then the Admin app.

7. **Check the link.** Sign in to the Admin app and open **System Monitoring**.
   *Main system link* should say **Connected**. If it says the link is not
   configured, recheck steps 4 and 5. A `Bad signature` error means the two
   secrets differ.

To rotate the secret later, change it in both apps at the same moment.

## Run locally

```bash
npm install
```

```bash
base44 login
```

```bash
base44 dev
```

The `admin` function forwards to `MAIN_ADMIN_API_URL`, so local runs reach
whichever main app that secret points to.

## Features

| Section | What it does |
|---|---|
| Dashboard | Live counts of students, teachers, SNED students, published lessons and open requests; AI and RFID status; recent teachers, students, activity and requests |
| Teacher Management | Add teacher (creates the school profile; the teacher signs up with that email), edit, assign advisory sections, view classes, deactivate/reactivate, send a password-reset email |
| Student Management | Search, section and SNED filters, profile with progress and assessments, authorized corrections, transfer to another advisory teacher (same record, history kept) |
| RFID Management | Readers' heartbeat; register / replace (select teacher → current card → tap → verify → old card off → save); deactivate lost cards; card numbers shown only as `•••• A1B2C3` |
| AI Agent Management | Real connection status, on/off switch, name/avatar, voice, speed, language, pass mark, spoken instructions; each kiosk's camera and microphone as reported in real lessons |
| Lesson Management | Draft → Published → Archived library, media uploads, pronunciation target, "Send to AI agent" |
| Admin Inbox | Teacher requests with search, category/status filters, conversation, replies, status changes |
| System Reports | Per-section and per-lesson results and teacher class sizes, with CSV export |
| System Monitoring | Main-system link, AI check, RFID readers and kiosk devices, refreshed every 15 s |
| Settings | School name, support contact, your two-step verification and password |
| Activity Logs | Every administrative change with who, what, which record, when and details; entries cannot be edited or deleted |

**What the connection statuses mean:**

- **Connected** is shown only when a real signal proves it: a successful real
  pronunciation assessment in the last 7 days, an RFID heartbeat in the last
  90 seconds, a kiosk's own camera/microphone report, or this page having
  loaded through the main-system link.
- **Configuration Required** means it has never been verified.
- **Disconnected** means the latest real signal failed.
- **Temporarily Disabled** means an administrator switched it off.

## Tests

The backend tests run the real function files of both apps against an
in-memory Base44 stand-in.

```bash
cd ../tests/backend
```

```bash
deno test --import-map=import_map.json --allow-env --no-check integration_test.ts
```
