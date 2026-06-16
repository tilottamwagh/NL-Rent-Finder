# NL Rent Finder — Facebook Capture extension

A Chrome/Edge extension that adds a one-click **＋ Capture** button to Facebook
group posts. Clicking it sends the post text to your NL Rent Finder backend,
which AI-parses it, saves it as a `Facebook` listing, and instantly matches it
against your active client queries.

This keeps a human in the loop (you're browsing the groups normally), so there
is **no Facebook automation and no ban risk** — Facebook just sees you reading
posts as usual.

## Install (Load unpacked)

1. Open **chrome://extensions** (or **edge://extensions**).
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this `extension/` folder.
4. (Optional) Click the extension icon → confirm the **API base URL** is
   `https://api.nlrentfinder.tilottamwagh.com` and hit **Save** — it will check
   the API is reachable.

## Use

1. Open any of your Facebook rental groups and scroll the feed.
2. Each post gets a small **＋ Capture** button in its top-right corner.
3. Click it. The button shows the result:
   - **✓ Saved** — captured and stored
   - **✓ N matches!** — captured *and* it fits N waiting clients (your alert)
   - **Duplicate** — you already captured this post
4. Backup method: select a post's text, right-click → **Capture rental post to
   NL Rent Finder**.

Captured listings appear on the **Listings** page (source: Facebook). Matches
appear on the **Matches** page.

## Notes

- Network calls are made from the extension's background service worker against
  a host declared in `host_permissions`, so page-origin CORS does not apply.
- Facebook's DOM changes often. The capture button is anchored to
  `[role="article"]`; if Facebook reworks that, update the selector in
  `content.js`.
- Optional: drop a `icon128.png` in this folder for a toolbar/notification icon.
