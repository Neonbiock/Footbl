(async function () {
  let { teams, matches } = await loadData();

  function refreshTeamSelects() {
    const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    const opts = sorted.map((t) => `<option value="${t.id}">${t.name} (${t.id})</option>`).join("");
    document.getElementById("m-home").innerHTML = opts;
    document.getElementById("m-away").innerHTML = opts;
  }

  function renderPreview() {
    const { ratings } = computeRatings(teams, matches);
    const rows = teams
      .map((t) => ({ team: t, rating: ratings[t.id] }))
      .sort((a, b) => b.rating - a.rating);

    document.getElementById("preview-note").textContent =
      `${teams.length} nation${teams.length === 1 ? "" : "s"} \u00b7 ${matches.length} match${matches.length === 1 ? "" : "es"} on record (recalculated live, nothing saved yet)`;

    const body = document.getElementById("preview-body");
    body.innerHTML = rows
      .map(
        (r, i) => `
        <tr>
          <td class="rank">${i + 1}</td>
          <td class="nation"><span class="flag">${teamBadge(r.team)}</span>${r.team.name}</td>
          <td class="conf">${r.team.confederation}</td>
          <td class="pts">${r.rating.toFixed(1)}</td>
        </tr>`
      )
      .join("");
  }

  function download(filename, varName, data) {
    const body = `const ${varName} = ${JSON.stringify(data, null, 2)};\n`;
    const blob = new Blob([body], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showStatus(id, message, ok) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.className = `status-msg ${ok ? "ok" : "err"}`;
  }

  // --- File-picker helpers: fill the text field with the chosen filename ---
  document.getElementById("t-logo-file").addEventListener("change", (e) => {
    if (e.target.files[0]) document.getElementById("t-logo").value = e.target.files[0].name;
  });
  document.getElementById("m-photo-file").addEventListener("change", (e) => {
    if (e.target.files[0]) document.getElementById("m-photo").value = e.target.files[0].name;
  });

  // --- Add nation ---
  document.getElementById("team-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("t-id").value.trim().toUpperCase();
    const name = document.getElementById("t-name").value.trim();
    const confederation = document.getElementById("t-conf").value;
    const flagCode = document.getElementById("t-flag").value.trim().toLowerCase();
    const foundedRaw = document.getElementById("t-founded").value.trim();
    const logo = document.getElementById("t-logo").value.trim();

    if (!id || !name) {
      showStatus("team-status", "ID and name are required.", false);
      return;
    }
    if (teams.some((t) => t.id === id)) {
      showStatus("team-status", `A nation with id "${id}" already exists \u2014 pick a different id.`, false);
      return;
    }

    const team = { id, name, confederation };
    if (flagCode) team.flagCode = flagCode;
    if (foundedRaw) team.founded = Number(foundedRaw);
    if (logo) team.logo = logo;

    teams.push(team);
    refreshTeamSelects();
    renderPreview();
    showStatus("team-status", `Added ${name}. Download teams.js whenever you're ready to publish.`, true);
    e.target.reset();
  });

  // --- Add match ---
  document.getElementById("match-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("m-date").value;
    const home = document.getElementById("m-home").value;
    const away = document.getElementById("m-away").value;
    const homeScore = Number(document.getElementById("m-home-score").value);
    const awayScore = Number(document.getElementById("m-away-score").value);
    const tournament = document.getElementById("m-tournament").value;
    const neutral = document.getElementById("m-neutral").checked;
    const note = document.getElementById("m-note").value.trim();
    const photo = document.getElementById("m-photo").value.trim();

    if (!date || !home || !away) {
      showStatus("match-status", "Date, home team, and away team are required.", false);
      return;
    }
    if (home === away) {
      showStatus("match-status", "Home and away teams must be different.", false);
      return;
    }

    const match = { date, home, away, homeScore, awayScore, tournament, neutral };
    if (note) match.note = note;
    if (photo) match.photo = photo;

    matches.push(match);
    renderPreview();
    showStatus("match-status", `Added the ${date} match. Download matches.js whenever you're ready to publish.`, true);
    e.target.reset();
    document.getElementById("m-home-score").value = 0;
    document.getElementById("m-away-score").value = 0;
  });

  document.getElementById("download-teams").addEventListener("click", () => download("teams.js", "TEAMS", teams));
  document.getElementById("download-matches").addEventListener("click", () => download("matches.js", "MATCHES", matches));

  refreshTeamSelects();
  renderPreview();
})();
