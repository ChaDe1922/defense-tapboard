# Google Apps Script Setup — Defense Tapboard

## Overview

The Apps Script Web App is a **generic endpoint** that receives JSON POST requests
from the Defense Tapboard client and writes data into **user-configured** Google Sheets.

The destination spreadsheet is **not hardcoded** — users paste a Google Sheet URL
into the app and configure tab names. Sheets must be **registered** with the endpoint
before writes are allowed.

### Sheet Tab Structure (defaults)

| Tab | Purpose |
|-----|---------|
| **Games** | One row per game session |
| **Plays** | One row per logged play |
| **Presets** | Persisted preset call shortcuts |
| **Lookups** | Reference values (play types, blitzes, stunts, outcomes) |
| **Audit_Log** | Sync action history |

Tab names are configurable per connection.

---

## Setup Steps

### 1. Create an Apps Script Project

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the default `Code.gs` content.
3. Copy the entire contents of `apps-script/Code.gs` from this repo and paste it in.
4. Save the project (Ctrl+S / Cmd+S).
5. Name the project (e.g. "Defense Tapboard API").

> **Note:** The script is NOT attached to any specific spreadsheet. It opens
> spreadsheets by ID using `SpreadsheetApp.openById()`.

### 2. Set the Admin Registration Key

1. In the Apps Script editor, go to **Project Settings** (gear icon on the left).
2. Scroll to **Script properties** → click **Add script property**.
3. Add:
   - **Property:** `ADMIN_REGISTRATION_KEY`
   - **Value:** Choose a strong secret (e.g. `my-secret-key-2026`)
4. Click **Save script properties**.

This key is required when registering a new spreadsheet from the app.

### 3. Deploy as Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to **Select type** → choose **Web app**.
3. Set:
   - **Description**: `Defense Tapboard API v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. **Authorize** the app when prompted (review permissions, click Allow).
6. Copy the **Web app URL**:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### 4. Configure the Client App

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Paste your Web App URL:
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
3. Restart the dev server (`npm run dev`).

### 5. Create a Destination Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **2026 Defense Data**.
3. **Share it** with the Google account that owns the Apps Script project (if different).
   The Apps Script runs as the deploying user, so that user must have edit access.

### 6. Connect the Sheet in the App

1. Open the app → **Setup** page → **Google Sheets connection** card.
2. Paste the Google Sheet URL.
3. Verify the parsed Sheet ID appears in green.
4. Optionally set a connection label and custom tab names.
5. Enter the **Registration key** (the same secret from step 2).
6. Click **Save Connection**.
7. Click **Test Connection** — should report accessible.
8. Click **Register Sheet** — registers the sheet ID with the endpoint.
9. Click **Initialize Sheet** — creates tabs and writes headers.

After this, games and plays will sync automatically.

---

## Security Model

- The Apps Script maintains a **registry** of approved spreadsheet IDs
  using `PropertiesService.getScriptProperties()`.
- A sheet must be **explicitly registered** before any writes are accepted.
- Registration requires the `ADMIN_REGISTRATION_KEY`.
- The registration key is sent only during the Register Sheet action, **never** on
  normal game/play writes.
- The app stores the key locally for convenience but does not send it on write requests.

---

## Updating the Script

After making changes to `Code.gs`:

1. Paste the updated code into the Apps Script editor.
2. Click **Deploy → Manage deployments**.
3. Click the edit (pencil) icon on your deployment.
4. Set **Version** to **New version**.
5. Click **Deploy**.

The URL stays the same — no client changes needed.

---

## Troubleshooting

- **"Not configured"** — `VITE_APPS_SCRIPT_URL` env var is missing or empty.
- **"Error"** — Endpoint URL set but health check failed. Verify URL and deployment.
- **"Not registered"** — Click Register Sheet in the app with the correct key.
- **"Cannot access spreadsheet"** — Share the sheet with the Apps Script owner account.
- **CORS issues** — Apps Script Web Apps with "Anyone" access handle CORS. Verify deployment access.
- **Plays not appearing** — Check the Audit_Log tab for error entries.

---

## API Contract

Single endpoint. All requests are POST with JSON body.

Every write request includes `spreadsheetId` and `tabs`:

```json
{
  "action": "upsertPlay",
  "spreadsheetId": "1abc...",
  "tabs": {
    "games": "Games",
    "plays": "Plays",
    "presets": "Presets",
    "lookups": "Lookups",
    "audit": "Audit_Log"
  },
  "payload": { ... }
}
```

### Supported Actions

| Action | Purpose | Requires Registration |
|--------|---------|----------------------|
| `healthCheck` | Verify endpoint is live | No |
| `testSheetAccess` | Test if sheet is accessible | No |
| `registerSheet` | Register a sheet (needs key) | No (creates registration) |
| `initializeSheet` | Create tabs + headers | Yes |
| `upsertGame` | Write/update a game row | Yes |
| `upsertPlay` | Write/update a play row | Yes |
| `upsertPresets` | Write/update preset rows | Yes |
| `seedLookups` | Seed lookup reference data | Yes |

### Response Shape

```json
{
  "ok": true,
  "action": "upsertPlay",
  "entityId": "play_123",
  "sheet": "Plays",
  "result": "created",
  "message": "Play created successfully",
  "remoteWrittenAt": "2026-03-25T12:00:00.000Z"
}
```

GET requests return a simple health check JSON response.
