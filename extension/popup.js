const DEFAULT_API = "https://api.nlrentfinder.tilottamwagh.com";
const input = document.getElementById("apiBase");
const status = document.getElementById("status");

chrome.storage.sync.get("apiBase").then(({ apiBase }) => {
  input.value = apiBase || DEFAULT_API;
});

document.getElementById("save").addEventListener("click", async () => {
  const val = input.value.trim().replace(/\/+$/, "") || DEFAULT_API;
  await chrome.storage.sync.set({ apiBase: val });
  status.textContent = "Saved ✓";
  status.className = "status ok";
  // Quick reachability check against the API health endpoint.
  try {
    const r = await fetch(`${val}/health`);
    if (r.ok) {
      status.textContent = "Saved ✓ — API reachable";
    } else {
      status.textContent = `Saved, but API returned ${r.status}`;
      status.className = "status err";
    }
  } catch (e) {
    status.textContent = "Saved, but API unreachable from here";
    status.className = "status err";
  }
});
