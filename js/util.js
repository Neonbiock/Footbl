const CONFEDERATIONS = ["UEFA", "CONMEBOL", "CONCACAF", "AFC", "CAF", "OFC", "OTHER"];

// Turns a 2-letter ISO code into a flag emoji (e.g. "gb" -> 🇬🇧).
// Falls back to a small marker for sub-national codes like "GB-ENG".
function flagEmoji(flagCode) {
  const code = (flagCode || "").slice(0, 2).toUpperCase();
  if (code.length !== 2) return "\u{1F3F3}\uFE0F"; // white flag fallback
  const A = 0x1f1e6;
  const chars = [...code].map((c) => A + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...chars);
}

// Renders a team's crest: an <img> if team.logo is set (a filename under
// images/teams/, or a full URL), falling back to a flag emoji if the field
// is empty or the image fails to load.
function teamBadge(team, size = "1em") {
  const fallback = flagEmoji(team.flagCode);
  if (!team.logo) return `<span class="badge-emoji">${fallback}</span>`;
  const src = /^https?:\/\//.test(team.logo) ? team.logo : `images/teams/${team.logo}`;
  return `<img class="badge" src="${src}" alt="" style="width:${size};height:${size}" onerror="this.outerHTML='<span class=badge-emoji>${fallback}</span>'" />`;
}

// Resolves a match "photo" field (filename under images/matches/, or a full URL).
function matchPhotoSrc(photo) {
  if (!photo) return null;
  return /^https?:\/\//.test(photo) ? photo : `images/matches/${photo}`;
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// Last N results (most recent first) as W/D/L letters for the ledger's form column.
function formLetters(history, n = 5) {
  return history.slice(-n).reverse().map((m) => {
    if (m.goalsFor > m.goalsAgainst) return "w";
    if (m.goalsFor < m.goalsAgainst) return "l";
    return "d";
  });
}

// data/teams.js and data/matches.js define global TEAMS / MATCHES arrays
// (loaded as plain <script> tags before this file) — this just hands back
// copies so nothing here mutates the page's original data by accident.
async function loadData() {
  return { teams: [...TEAMS], matches: [...MATCHES] };
}
