# Connect your Google Calendar (free, about 5 minutes)

The hub reads your calendar through a tiny Google Apps Script that runs in **your own Google account**.
It only returns today's and tomorrow's events, and no third-party service sees them.

Do this on your Mac, signed in to the Google account whose calendar you want to show.

1. Go to **https://script.google.com** and click **New project**.
2. Delete the sample code, then paste in everything from
   [`calendar-script.gs`](calendar-script.gs) (in this repo). Click the 💾 **Save** icon.
   Name the project `Basement Hub calendar`.
3. Click ⚙ **Project Settings** (left sidebar) and check that the **Time zone** is
   `(GMT-06:00) Central Time - Regina`. Change it if not.
4. Click **Deploy → New deployment**. Click the gear next to *Select type* and choose **Web app**.
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy**.
5. Google asks you to **Authorize access**. Choose your account. If you see "Google hasn't verified
   this app", click **Advanced → Go to Basement Hub calendar (unsafe)** — it's your own script —
   then **Allow** (it only asks to read your calendars).
6. Copy the **Web app URL** (it ends in `/exec`).
7. On the hub: **⚙ Settings → Calendar**, paste the URL, tap **Test**, then **Save**.

**Keep that URL private.** Anyone who has it can see today's and tomorrow's event titles.
If it ever leaks: in Apps Script, go to **Deploy → Manage deployments**, archive it, and make a new one.

**Only some calendars?** Edit `ONLY_CALENDARS` at the top of the script, e.g. `['Moman', 'Family']`,
then **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (the URL stays the same).

Voice: “What's on my calendar?”, “What's my next meeting?”, “What do I have tomorrow?”
