/**
 * The Football Ledger — rating engine
 *
 * A World-Football-Elo-style system: every nation starts at 1500 and matches
 * are replayed in chronological order. Bigger matches move the rating more
 * (the K weight), and winning big moves it further (the goal-difference
 * multiplier). Home advantage is modelled as a ratings bonus.
 *
 * Edit K_WEIGHTS or STARTING_RATING below to tune how the ledger behaves —
 * everything downstream (rankings + team pages) recalculates automatically.
 */

const STARTING_RATING = 1500;
const HOME_ADVANTAGE = 100;

// How much weight a result carries, by tournament type. Add new keys here
// if you introduce new "tournament" values in data/matches.js.
const K_WEIGHTS = {
  friendly: 20,
  qualifier: 35,
  continental: 50,
  world_cup: 60,
};

/**
 * This is the user's own calculate_elo() Python function, ported 1:1 to JS
 * (same steps, same rounding to 2 decimal places). Everything else in this
 * file just calls this once per match, in date order, to build up ratings
 * and a per-team history.
 */
function calculateElo(rHome, rAway, goalsHome, goalsAway, k = 20, homeAdvantage = 100) {
  // 1. Expected win probability
  const dr = rHome + homeAdvantage - rAway;
  const weHome = 1 / (Math.pow(10, -dr / 400) + 1);

  // 2. Actual outcome
  let wHome;
  if (goalsHome > goalsAway) wHome = 1.0;
  else if (goalsHome === goalsAway) wHome = 0.5;
  else wHome = 0.0;

  // 3. Goal multiplier
  const margin = Math.abs(goalsHome - goalsAway);
  let g;
  if (margin <= 1) g = 1.0;
  else if (margin === 2) g = 1.5;
  else if (margin === 3) g = 1.75;
  else g = 1.75 + (margin - 3) / 8.0;

  // 4. Points exchange
  const deltaR = round2(k * g * (wHome - weHome));
  const newRHome = round2(rHome + deltaR);
  const newRAway = round2(rAway - deltaR);
  return { newRHome, newRAway, deltaR };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Rating a team held as of a given cutoff date (inclusive), based on its
 * pre-computed history from computeRatings(). Pass cutoff = null for the
 * current/final rating. This is what powers "rankings as of year X",
 * the same way FIFA publishes a new snapshot each time.
 */
function ratingAsOf(teamHistory, cutoff, finalRating) {
  if (!cutoff) return finalRating;
  let rating = STARTING_RATING;
  for (const m of teamHistory) {
    if (m.date > cutoff) break;
    rating = m.ratingAfter;
  }
  return rating;
}

function historyAsOf(teamHistory, cutoff) {
  if (!cutoff) return teamHistory;
  return teamHistory.filter((m) => m.date <= cutoff);
}

/**
 * Replays every match chronologically and returns:
 *  - ratings: { teamId -> current rating }
 *  - history: { teamId -> [ { date, opponent, ... , ratingBefore, ratingAfter, delta } ] }
 */
function computeRatings(teams, matches) {
  const ratings = {};
  const history = {};
  teams.forEach((t) => {
    ratings[t.id] = STARTING_RATING;
    history[t.id] = [];
  });

  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  for (const m of sorted) {
    if (!(m.home in ratings) || !(m.away in ratings)) continue; // unknown team, skip safely

    const K = K_WEIGHTS[m.tournament] ?? K_WEIGHTS.friendly;
    const homeRatingBefore = ratings[m.home];
    const awayRatingBefore = ratings[m.away];
    const homeAdv = m.neutral ? 0 : HOME_ADVANTAGE;

    const { newRHome, newRAway, deltaR } = calculateElo(
      homeRatingBefore,
      awayRatingBefore,
      m.homeScore,
      m.awayScore,
      K,
      homeAdv
    );

    ratings[m.home] = newRHome;
    ratings[m.away] = newRAway;

    history[m.home].push({
      date: m.date,
      opponent: m.away,
      venue: m.neutral ? "neutral" : "home",
      goalsFor: m.homeScore,
      goalsAgainst: m.awayScore,
      tournament: m.tournament,
      note: m.note || null,
      photo: m.photo || null,
      ratingBefore: homeRatingBefore,
      ratingAfter: newRHome,
      delta: deltaR,
    });
    history[m.away].push({
      date: m.date,
      opponent: m.home,
      venue: m.neutral ? "neutral" : "away",
      goalsFor: m.awayScore,
      goalsAgainst: m.homeScore,
      tournament: m.tournament,
      note: m.note || null,
      photo: m.photo || null,
      ratingBefore: awayRatingBefore,
      ratingAfter: newRAway,
      delta: -deltaR,
    });
  }

  return { ratings, history };
}
