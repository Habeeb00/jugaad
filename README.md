# Jugad

**Jugad** turns TinkerHub event links into Google Calendar invites instantly.

Works flawlessly on **Android** (via Share Target) and **Web** (Desktop/Mobile). Stop manually copy-pasting—just share or paste the link, and Jugad handles the rest.

![Jugad App Screenshot](/icon.png)

## 🚀 Features

- **Instant Parsing**: Automatically extracts event title, date, time, venue, and description from TinkerHub event pages.
- **PWA Share Target**: Integrated directly into your phone's "Share" menu. Share a URL from Chrome/WhatsApp directly to Jugad and it gives u calendar invites.
- **Offline Ready**: Works offline thanks to robust Service Worker caching.
- **Zero Friction**: No login required. Just paste the link or share it.
- **Mobile First**: Clean, app-like interface optimized for any screen size.

## 📱 How to Install

Jugad is a PWA, meaning it works best when installed on your home screen:

1. Open **[jugadhub.vercel.app](https://jugadhub.vercel.app)** in Chrome based browsers.
2. Click Install
3. Now you can find "Jugad" in your app drawer!

## 🛠️ Usage

### Method 1: The "Share" Menu (Best Experience)
1. Found an event on a TinkerHub page?
2. Tap **Share** in your browser.
3. Select **Jugad** from the list of apps.
4. The app opens instantly with event details pre-loaded. Click **"Add to Calendar"**.

### Method 2: Manual Paste
1. Copy the event URL.
2. Open Jugad.
3. Paste the link and hit **Go**.

## 💻 Tech Stack

- **Frontend**: Vanilla HTML, CSS (Shadcn UI inspired), and JavaScript.
- **Backend Proxy**: Vercel Serverless Functions (Node.js) to bypass CORS restrictions when fetching event pages.
- **Hosting**: Vercel.

## 🏃‍♂️ Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Habeeb00/jugaad.git
   ```
2. Install dependencies (for the dev server):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

## 📝 License

This project is open-source and available under the ISC License.

---
*Made with ❤️ for the TinkerHub community.*
