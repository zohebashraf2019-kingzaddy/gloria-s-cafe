# Gloria's Cafe — Website

Static site for Gloria's Cafe (2365 Dickerson Rd, Reno, NV 89503) by Nexora Digital.

- `index.html` – page markup (hero, favorites, menu tabs, story, reels, gallery, reviews, visit/map)
- `styles.css` – theme (black + logo gold `#D79132` + cream)
- `script.js` – mobile nav, menu tabs, live open/closed status (Pacific time), reels autoplay, lightbox
- `assets/` – optimized photos, logo, social reels

Deploy: push to GitHub, import the repo in Vercel (Framework: Other, no build step).

## Reservations

The "Reserve a Table" form sends a request (not an instant booking). The cafe confirms by phone or text.

- Front end: `#reserve` section in `index.html` plus logic in `script.js`. It blocks Tuesdays and past times, and offers seating times up to 30 min before close.
- Back end: `api/reserve.js` (Vercel serverless) emails the cafe through [Resend](https://resend.com) and sends the guest a "request received" email.
- **Until email is connected**, the API returns 503 and the form opens the guest's email app pre-filled to Gloriascafe.nv@gmail.com, so it works on day one.

To turn on automatic emails, add these in Vercel → Settings → Environment Variables, then redeploy:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | from resend.com → API Keys |
| `CAFE_EMAIL` | inbox for requests (default Gloriascafe.nv@gmail.com) |
| `FROM_EMAIL` | sender on a verified domain, e.g. `Gloria's Cafe <reservations@gloriascafe.com>` |
