(async function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const content = document.getElementById("content");

  const { teams, matches } = await loadData();
  const team = teams.find((t) => t.id === id);

  if (!team) {
    content.innerHTML = `<p class="empty-state">No nation found for id "${id ?? ""}". Check the URL, or the id in data/teams.js.</p>`;
    return;
  }

  const { ratings, history } = computeRatings(teams, matches);
  const hist = history[team.id] || [];

  const rankedIds = teams.map((t) => t.id).sort((a, b) => ratings[b] - ratings[a]);
  const rank = rankedIds.indexOf(team.id) + 1;

  document.title = `${team.name} — The Football Ledger`;

  const record = hist.reduce(
    (acc, m) => {
      if (m.goalsFor > m.goalsAgainst) acc.w++;
      else if (m.goalsFor < m.goalsAgainst) acc.l++;
      else acc.d++;
      return acc;
    },
    { w: 0, d: 0, l: 0 }
  );

  content.innerHTML = `
    <div class="team-header">
      <span class="flag-big">${teamBadge(team, "2.6rem")}</span>
      <h1>${team.name}</h1>
    </div>
    <div class="team-meta">
      <span><strong>#${rank}</strong> in the world</span>
      <span>${team.confederation}</span>
      <span class="rating-big">${ratings[team.id].toFixed(1)}</span>
      <span>${record.w}W &ndash; ${record.d}D &ndash; ${record.l}L (${hist.length} matches on record)</span>
    </div>

    <div class="chart-box" id="chart-box"></div>

    <h2 class="section-title">Match log</h2>
    ${hist.length ? "" : '<p class="empty-state">No matches recorded yet. Add some to data/matches.js.</p>'}
    ${
      hist.length
        ? `<table class="matchlog">
        <thead>
          <tr><th>Date</th><th>Opponent</th><th>Venue</th><th>Score</th><th>Competition</th><th>Rating</th></tr>
        </thead>
        <tbody>
          ${[...hist]
            .reverse()
            .map((m) => {
              const opp = teams.find((t) => t.id === m.opponent);
              const deltaClass = m.delta > 0 ? "up" : m.delta < 0 ? "down" : "";
              const deltaSign = m.delta > 0 ? "+" : "";
              const photoSrc = matchPhotoSrc(m.photo);
              return `<tr>
                <td>${formatDate(m.date)}</td>
                <td>${opp ? teamBadge(opp) + " " + opp.name : m.opponent}</td>
                <td>${m.venue}</td>
                <td>${m.goalsFor}&ndash;${m.goalsAgainst}</td>
                <td>${m.tournament.replace("_", " ")}</td>
                <td>${m.ratingAfter.toFixed(1)} <span class="delta ${deltaClass}">(${deltaSign}${m.delta.toFixed(2)})</span></td>
              </tr>
              ${
                m.note || photoSrc
                  ? `<tr><td></td><td colspan="5" class="note">
                      ${photoSrc ? `<img class="match-photo" src="${photoSrc}" alt="" onerror="this.remove()" />` : ""}
                      ${m.note || ""}
                    </td></tr>`
                  : ""
              }`;
            })
            .join("")}
        </tbody>
      </table>`
        : ""
    }
  `;

  renderChart(hist);

  function renderChart(hist) {
    const box = document.getElementById("chart-box");
    if (!hist.length) {
      box.innerHTML = '<p class="empty-state">No rating history yet.</p>';
      return;
    }

    const points = [{ date: null, rating: 1500 }, ...hist.map((m) => ({ date: m.date, rating: m.ratingAfter }))];
    const width = Math.max(560, points.length * 46);
    const height = 200;
    const padX = 30;
    const padY = 20;

    const ratingsOnly = points.map((p) => p.rating);
    const min = Math.min(...ratingsOnly) - 20;
    const max = Math.max(...ratingsOnly) + 20;

    const xStep = (width - padX * 2) / Math.max(1, points.length - 1);
    const yFor = (r) => height - padY - ((r - min) / (max - min)) * (height - padY * 2);
    const xFor = (i) => padX + i * xStep;

    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(p.rating).toFixed(1)}`).join(" ");

    const dots = points
      .map((p, i) => `<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(p.rating).toFixed(1)}" r="3" fill="var(--pitch)" />`)
      .join("");

    box.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Rating over time">
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="var(--rule)" />
        <path d="${path}" fill="none" stroke="var(--pitch)" stroke-width="2" />
        ${dots}
      </svg>
    `;
  }
})();
