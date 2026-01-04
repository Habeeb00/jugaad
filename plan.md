# Android Share-to-Calendar PWA (Zero-Change Jugad)

## Problem
TinkerHub events generate tickets with date, time, QR, and share links, but there is **no calendar integration**.  
We **cannot modify**:
- TinkerHub mobile app
- TinkerHub website
- Backend or QR links

We want:
> Share event link → Add to Calendar → User confirms

---

## Core Idea
Build an **Android PWA** that:
- Appears in the **Android Share Sheet**
- Accepts a shared event URL
- Extracts event details by opening the page
- Shows a **pre-filled Add to Calendar** action
- Opens the calendar app for confirmation

This uses Android’s **Web Share Target API**.

---

## Supported Platforms
- ✅ Android (Chrome-based browsers)
- ❌ iOS (no Share Target support)
- ❌ Silent auto-add (blocked by OS)

---

## End-to-End User Flow

1. User opens a TinkerHub event page anywhere.
2. User taps **Share**.
3. Selects **Add to Calendar** (our PWA).
4. PWA opens and receives the event URL.
5. PWA fetches and parses the event page.
6. Event details are shown to the user.
7. User taps **Add to Calendar**.
8. Calendar app opens with pre-filled event.
9. User confirms.

---

## Architecture Overview

- PWA frontend (HTML + JS)
- Web App Manifest with `share_target`
- Serverless fetch proxy (to bypass CORS)
- Google Calendar template URLs
- Optional `.ics` generation

---

## Web App Manifest (`manifest.json`)

```json
{
  "name": "Add to Calendar",
  "short_name": "Calendar",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "GET",
    "params": {
      "url": "url",
      "title": "title",
      "text": "text"
    }
  }
}
```

---

## Routes

### `/`
- Intro page
- Explains functionality
- CTA: **Install to use Share feature**

### `/share`
- Entry point from Android Share Sheet
- Receives `?url=EVENT_URL`
- Core logic runs here

---

## `/share` Logic (Detailed)

### Step 1: Receive Shared Data
- Read `url` from query params
- Validate URL

### Step 2: Fetch Event Page
Because of CORS:
- Use a serverless proxy (Cloudflare Worker / Netlify / Vercel)
- Proxy fetches HTML and returns raw content

### Step 3: Parse Event Data
Extract:
- Event title
- Start date
- End date
- Timezone
- Location

### Step 4: Time Conversion
- Convert local time (IST) → UTC
- Calendar format:
  `YYYYMMDDTHHMMSSZ`

---

## Event Preview UI
Display:
- Event title
- Date & time
- Location
- Source URL

Buttons:
- **➕ Add to Calendar**
- (Optional) Edit details

---

## Calendar Integration

### Primary: Google Calendar Template (Android / Web)

```
https://calendar.google.com/calendar/render?action=TEMPLATE
&text=EVENT_TITLE
&dates=START_UTC/END_UTC
&location=LOCATION
&details=EVENT_URL
```

---

## Permissions & Privacy
- No calendar permission required
- No login required
- No data stored
- User action required for calendar add

---

## Installation Flow
1. User opens PWA URL in Chrome.
2. Chrome prompts **Add to Home Screen**.
3. App is installed.
4. App appears in Android Share Sheet.

---

## Constraints
- ❌ No silent calendar insertion
- ❌ No automatic popup on share
- ❌ No iOS Share Sheet support
- ❌ No backend changes to TinkerHub

---

## Success Criteria
- PWA appears in Android Share Sheet
- Correct event details extracted
- Calendar opens with pre-filled data
- User can add event in ≤ 2 taps

---

## Final Note
This is the **maximum possible automation** allowed by modern mobile OSes without modifying the source app or website.
