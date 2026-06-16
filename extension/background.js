// NL Rent Finder — Capture: service worker.
// All network calls happen here (not in the content script) so that requests
// are made from the extension origin against a host in host_permissions,
// which sidesteps page-origin CORS entirely.

const DEFAULT_API = "https://api.nlrentfinder.tilottamwagh.com";

async function getApiBase() {
  const { apiBase } = await chrome.storage.sync.get("apiBase");
  return (apiBase || DEFAULT_API).replace(/\/+$/, "");
}

async function capture({ text, url, groupName }) {
  const base = await getApiBase();
  const resp = await fetch(`${base}/api/listings/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source: "Facebook",
      source_url: url || "",
      group_name: groupName || ""
    })
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${detail}`.slice(0, 200));
  }
  return resp.json();
}

function notify(title, message) {
  // Notifications need an icon; fall back silently if none is bundled.
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title,
      message
    });
  } catch (e) {
    /* icon optional */
  }
}

function summarize(result) {
  if (result.duplicate) return "Already captured — skipped duplicate.";
  const l = result.listing || {};
  const bits = [l.city, l.rent_price ? `€${l.rent_price}/mo` : null, l.rooms ? `${l.rooms} rm` : null]
    .filter(Boolean)
    .join(" · ");
  let msg = `Saved: ${bits || "listing"}`;
  if (result.matches && result.matches.length) {
    const top = result.matches[0];
    msg += `\n⚡ ${result.matches.length} client match${result.matches.length > 1 ? "es" : ""}! Top: ${top.client} (${top.score})`;
  }
  return msg;
}

// ── Right-click context menu (backup capture path) ──
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "nlrf-capture",
    title: "Capture rental post to NL Rent Finder",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "nlrf-capture") return;
  try {
    const result = await capture({ text: info.selectionText, url: tab?.url });
    notify("NL Rent Finder", summarize(result));
  } catch (e) {
    notify("Capture failed", String(e.message || e));
  }
});

// ── Messages from the in-page Capture buttons ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "nlrf-capture") return;
  capture({ text: msg.text, url: msg.url, groupName: msg.groupName })
    .then((result) => {
      notify("NL Rent Finder", summarize(result));
      sendResponse({ ok: true, result });
    })
    .catch((e) => {
      notify("Capture failed", String(e.message || e));
      sendResponse({ ok: false, error: String(e.message || e) });
    });
  return true; // keep the message channel open for the async response
});
