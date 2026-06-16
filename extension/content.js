// NL Rent Finder — Capture: content script.
// Adds a small "＋ Capture" button to each Facebook post. We target
// [role="article"] (the post container), which is one of the more stable
// hooks in Facebook's otherwise-obfuscated DOM. A MutationObserver handles
// posts that load lazily as you scroll.

const BTN_CLASS = "nlrf-capture-btn";

function groupName() {
  // Best-effort: the page <title> usually contains the group name.
  return (document.title || "").replace(/\s*\|\s*Facebook\s*$/i, "").trim();
}

function postPermalink(article) {
  // Prefer a real post/permalink link inside the article.
  const a = article.querySelector(
    'a[href*="/posts/"], a[href*="permalink"], a[href*="/groups/"][href*="/posts/"]'
  );
  if (a && a.href) return a.href.split("?")[0];
  return location.href.split("?")[0];
}

function postText(article) {
  // textContent collapses the post body; trim Facebook chrome like "See more".
  let t = (article.innerText || article.textContent || "").trim();
  t = t.replace(/\bSee more\b/gi, " ").replace(/\s{3,}/g, "  ");
  return t.slice(0, 4000);
}

function makeButton(article) {
  const btn = document.createElement("button");
  btn.className = BTN_CLASS;
  btn.textContent = "＋ Capture";
  btn.title = "Capture this post to NL Rent Finder";
  Object.assign(btn.style, {
    position: "absolute",
    top: "8px",
    right: "8px",
    zIndex: "9999",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)"
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = postText(article);
    if (text.length < 15) {
      flash(btn, "Too short", "#ef4444");
      return;
    }
    btn.textContent = "Capturing…";
    btn.disabled = true;
    chrome.runtime.sendMessage(
      { type: "nlrf-capture", text, url: postPermalink(article), groupName: groupName() },
      (resp) => {
        btn.disabled = false;
        if (resp && resp.ok) {
          const m = resp.result?.matches?.length || 0;
          if (resp.result?.duplicate) flash(btn, "Duplicate", "#f59e0b");
          else if (m > 0) flash(btn, `✓ ${m} match${m > 1 ? "es" : ""}!`, "#10b981");
          else flash(btn, "✓ Saved", "#10b981");
        } else {
          flash(btn, "Failed", "#ef4444");
        }
      }
    );
  });

  return btn;
}

function flash(btn, label, color) {
  btn.textContent = label;
  btn.style.background = color;
  setTimeout(() => {
    btn.textContent = "＋ Capture";
    btn.style.background = "#6366f1";
  }, 2500);
}

function decorate(article) {
  if (article.dataset.nlrfDecorated) return;
  article.dataset.nlrfDecorated = "1";
  // Anchor the absolutely-positioned button to the article.
  if (getComputedStyle(article).position === "static") {
    article.style.position = "relative";
  }
  article.appendChild(makeButton(article));
}

function scan() {
  document.querySelectorAll('[role="article"]').forEach(decorate);
}

const observer = new MutationObserver(() => {
  // Debounce-ish: scan on the next frame to batch bursts of DOM changes.
  window.requestAnimationFrame(scan);
});
observer.observe(document.body, { childList: true, subtree: true });
scan();
