/**
 * Basement Hub — calendar feed (Google Apps Script, free).
 *
 * Runs inside YOUR Google account and returns only today's and tomorrow's
 * events as JSON for the Basement Hub dashboard. Nothing is sent anywhere else.
 * Setup steps: see CALENDAR.md.
 */

// Leave empty to include every calendar you can see (except hidden ones),
// or list calendar names to include only those, e.g. ['Moman', 'Family'].
const ONLY_CALENDARS = [];

function doGet() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const events = [];
  CalendarApp.getAllCalendars().forEach(function (cal) {
    if (cal.isHidden()) return;
    if (ONLY_CALENDARS.length && ONLY_CALENDARS.indexOf(cal.getName()) === -1) return;
    cal.getEvents(start, end).forEach(function (ev) {
      try {
        if (ev.getMyStatus && ev.getMyStatus() === CalendarApp.GuestStatus.NO) return; // skip declined
      } catch (e) {}
      events.push({
        title: ev.getTitle() || '(No title)',
        start: ev.getStartTime().toISOString(),
        end: ev.getEndTime().toISOString(),
        allDay: ev.isAllDayEvent(),
        location: ev.getLocation() || '',
        calendar: cal.getName()
      });
    });
  });
  events.sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });

  return ContentService
    .createTextOutput(JSON.stringify({ events: events, at: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}
