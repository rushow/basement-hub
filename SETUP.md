# Basement Hub — setup guide

A free, open dashboard + motion camera for the Galaxy S23 FE. Everything runs in Chrome on the phone:
clock, Regina weather, top CBC news (Saskatchewan / Canada), a voice assistant, focus timer, countdowns,
and a live security camera that records clips and sends alerts to your main phone. No paid apps, no accounts except a free GitHub one for hosting.

**Time needed:** about 20 minutes.

---

## 1. Put the app online (GitHub Pages, free) — on your Mac

Chrome only allows camera access on a secure (https) page, so the app needs a free https home.

1. Sign in at github.com and create a **new public repository** named `basement-hub`.
2. Click **Add file → Upload files**, and drag in these 5 files from the zip:
   `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`. Commit.
3. Go to the repo's **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**,
   branch **main**, folder **/ (root)**, and save.
4. After a minute, your app is live at `https://YOUR-USERNAME.github.io/basement-hub/`.

The code holds no secrets. Your alert topic, settings and recordings stay on the phone.

## 2. Prepare the S23 FE

Use the search bar in **Settings** to find each item (menu paths move between One UI versions).

- [ ] Update the phone and connect it to Wi-Fi **in the basement** (check the signal there).
- [ ] **Battery protection** → turn on, **Maximum** (stops at 80%). Important for a phone that is always plugged in.
- [ ] **Auto optimization / Restart when needed** → turn **off** (otherwise the phone restarts at night and the app stops).
- [ ] **Screen lock type** → **Swipe** (so the app comes back without a PIN after a power cut; the app has its own PIN).
- [ ] **Do not disturb** → on. **Always On Display** → off.
- [ ] **Apps → Chrome → Battery** → **Unrestricted**. Also make sure Chrome is **not** in *Sleeping apps / Deep sleeping apps*.

## 3. Install the app on the phone

1. Open **Chrome** on the S23 FE and go to your GitHub Pages address.
2. Tap **Allow** when it asks for the camera. The first time you tap the 🎤 button, also allow the **microphone**.
3. Chrome menu **⋮ → Add to home screen → Install**. Open it from the new **Basement Hub** icon (it runs full-screen).
4. **Lock the phone to the app:** search Settings for **Pin app** (app pinning) and turn it on.
   Then open Recent apps, tap the Basement Hub icon at the top of its card → **Pin this app**.

## 4. Alerts on your main phone (ntfy, free and open source)

1. Install **ntfy** on your main phone (Play Store, F-Droid, or App Store).
2. On the hub, tap **⚙ (top-right of the clock)** → next to *Topic*, tap **New** → **Save**.
3. Open ⚙ again, read the topic, and in the ntfy app tap **+** and subscribe to exactly that topic.
4. Tap **Send test alert** on the hub. You should get a notification with a snapshot.

Privacy note: the default server, ntfy.sh, is public. Anyone who knows your topic name can read it,
which is why the topic is a long random string. Snapshots sit on their server for a few hours.
For full privacy you can later self-host ntfy (the OnePlus 6T could do this).

## 5. Mount and tune

- The **front camera** watches the room, so the screen and camera face the same way.
  Aim it at the stairs, door, or basement window while keeping the screen readable from your desk.
- Use a reliable USB-C charger (15 W or more). Keep the phone out of direct sun and enclosed spaces.
- A small **night light** helps a lot; the front camera struggles in total darkness.
- In ⚙ Settings → **Motion sensitivity**: walk past and watch the bar under the preview.
  Green = current movement, red = over the trigger level. Raise sensitivity until walking past turns it red,
  but sitting still doesn't.
- Set a **PIN** (protects Disarm and Settings) and, if you like, an **auto-arm schedule** (e.g. 23:00–07:00).

## Calendar

To show today's Google Calendar events on the left, follow **[CALENDAR.md](CALENDAR.md)** (about 5 minutes, free).

## Voice assistant

Tap the round 🎤 button (next to the clock) and speak. Replies are spoken and shown on screen. Try:

- “What's on my calendar?” · “What's my next meeting?” · “What do I have tomorrow?”
- “What's the temperature?” · “Will it snow tomorrow?” · “What's the forecast?”
- “Read the news” · “Canada news” · “Read the second story”
- “Start a 25 minute timer” · “How much time is left?” · “Pause the timer” · “Start a break”
- “Arm the camera” · “Any motion?” · “Disarm” (asks for your PIN on screen if one is set)
- “How many days until the journal submission?” (uses your countdowns)
- “What time is it?” · “What is 15 times 4?” · “Who is Ada Lovelace?” (Wikipedia) · “Help”

**Hands-free (“Hey Hub …”)** is in ⚙ Settings → Voice assistant. It's experimental: Chrome on Android
may play a short beep each time it restarts listening, so it's off by default.

Speech recognition is done by Chrome (Google's free speech service), so it needs internet.

## News

The middle column shows the top 3 CBC headlines. Tap **Sask** or **Canada** to switch, tap a headline
to read its summary (or have it read aloud). Headlines refresh every 20 minutes through the free
rss2json service, with a second free service as a backup.

## How it behaves

| State | Screen | Camera |
|---|---|---|
| **Watching** (disarmed) | Goes black after 90 s of no motion/touch; motion wakes it | Detects motion only — nothing is recorded |
| **Arming** | Counts down (30 s exit delay) | — |
| **Armed** | Stays black (doesn't light up for an intruder); touch to wake | On motion: snapshot + clip saved on the phone, alert sent |

- The **live camera** fills the right side. Its bottom bar shows the status, Recordings and Arm/Disarm.
- **Recordings** button: view, play and download saved clips. Oldest are deleted after 150 (configurable).
- **☾** blanks the screen now. **⛶** toggles full screen. **⚙** → Theme switches between dark and light sky blue.
- If the phone is **unplugged**, you get an alert (power-cut warning).
- The app reloads itself around 4 AM daily to stay fresh, and restarts the camera if it ever stalls.
- Black screen = AMOLED pixels off, so there's no burn-in; the dashboard also shifts a few pixels every few minutes.

## Known limits

- **No remote live view.** You get snapshot alerts; clips are viewed on the hub (or downloaded from it).
- Chrome must stay the **foreground app** — that's why you pin it.
- After a reboot, open Basement Hub from the home screen again (and re-pin).
- Test it for a day before relying on it, and adjust the sensitivity if you get false alerts
  (lights switching on, a furnace vent, pets).

## Updating the app

Edit the files in GitHub, then change `VERSION` in `sw.js` (e.g. `bh-v2`) so the phone picks up the new version.
Reload the app (⚙ → Reload app) on the hub.
