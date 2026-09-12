(async function () {
  const { teams, matches } = await loadData();
  const { ratings: finalRatings, history } = computeRatings(teams, matches);

  let activeConf = "ALL";
  let query = "";
  let cutoff = null; // null = current/latest. Otherwise "YYYY-12-31" for a year snapshot.

  function populateYearSelect() {
    const select = document.getElementById("year-select");
    const years = [...new Set(matches.map((m) => Number(m.date.slice(0, 4))))].sort((a, b) => a - b);

    select.innerHTML = `<option value="">Current</option>` + years.map((y) => `<option value="${y}">${y}</option>`).join("");

    select.addEventListener("change", () => {
      cutoff = select.value ? `${select.value}-12-31` : null;
      render();
    });
  }

  function buildTabs() {
    const tabs = document.getElementById("tabs");
    const confs = ["ALL", ...CONFEDERATIONS];
    tabs.innerHTML = "";
    confs.forEach((c) => {
      const btn = document.createElement("button");
      btn.textContent = c === "ALL" ? "World" : c === "OTHER" ? "Other" : c;
      btn.className = c === activeConf ? "active" : "";
      btn.setAttribute("role", "tab");
      btn.addEventListener("click", () => {
        activeConf = c;
        render();
      });
      tabs.appendChild(btn);
    });
  }

  function render() {
    buildTabs();

    let rows = teams
      .map((t) => {
        const teamHist = history[t.id] || [];
        const histUpTo = historyAsOf(teamHist, cutoff);
        const rating = ratingAsOf(teamHist, cutoff, finalRatings[t.id]);
        return { team: t, rating, hist: histUpTo };
      })
      .filter((r) => activeConf === "ALL" || r.team.confederation === activeConf)
      .filter((r) => r.team.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.rating - a.rating);

    const body = document.getElementById("ledger-body");
    const empty = document.getElementById("empty");
    const count = document.getElementById("count");

    const asOfLabel = cutoff ? `as of ${cutoff.slice(0, 4)}` : "current";
    count.textContent = `${rows.length} nation${rows.length === 1 ? "" : "s"} \u00b7 ${asOfLabel}`;
    body.innerHTML = "";
    empty.hidden = rows.length !== 0;

    rows.forEach((r, i) => {
      const rank = i + 1;
      const tr = document.createElement("tr");
      tr.tabIndex = 0;
      tr.addEventListener("click", () => {
        window.location.href = `team.html?id=${encodeURIComponent(r.team.id)}`;
      });
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter") tr.click();
      });

      const medalClass = rank <= 3 ? ` medal-${rank}` : "";
      const letters = formLetters(r.hist);
      const formHtml = letters.map((l) => `<span class="${l}">${l.toUpperCase()}</span>`).join(" ");

      tr.innerHTML = `
        <td class="rank${medalClass}">${rank}</td>
        <td class="nation"><span class="flag">${teamBadge(r.team)}</span>${r.team.name}</td>
        <td class="conf">${r.team.confederation}</td>
        <td class="pts">${r.rating.toFixed(1)}</td>
        <td class="form">${formHtml || "&mdash;"}</td>
      `;
      body.appendChild(tr);
    });
  }

  document.getElementById("search").addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  populateYearSelect();
  render();
})();

