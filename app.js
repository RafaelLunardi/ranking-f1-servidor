const data = window.championshipData;

const seriesTabs = document.querySelector("#seriesTabs");
const rankingModeButtons = document.querySelectorAll("[data-ranking-mode]");
const rankingBody = document.querySelector("#rankingBody");
const activeSeriesTitle = document.querySelector("#activeSeriesTitle");
const activeSeriesInfo = document.querySelector("#activeSeriesInfo");
const rankingNameHeader = document.querySelector("#rankingNameHeader");
const rankingDetailHeader = document.querySelector("#rankingDetailHeader");
const totalDrivers = document.querySelector("#totalDrivers");
const nextRaceDate = document.querySelector("#nextRaceDate");
const raceList = document.querySelector("#raceList");
const newsGrid = document.querySelector("#newsGrid");
const liveKpis = document.querySelector("#liveKpis");
const liveList = document.querySelector("#liveList");
const rulesGrid = document.querySelector("#rulesGrid");
let activeSeries = "Serie A";
let rankingMode = "drivers";

function markActivePage() {
  const page = document.body.dataset.page;
  if (!page) {
    return;
  }

  document.querySelectorAll("[data-nav]").forEach((link) => {
    const isActive = link.dataset.nav === page;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function renderRanking(seriesName) {
  if (!rankingBody || !activeSeriesTitle || !activeSeriesInfo) {
    return;
  }

  activeSeries = seriesName;
  const drivers = data.rankings[seriesName];
  activeSeriesTitle.textContent = seriesName;
  activeSeriesInfo.textContent =
    rankingMode === "drivers"
      ? `${drivers.length} pilotos classificados nesta divisao`
      : `${getConstructors(drivers).length} construtores classificados nesta divisao`;

  if (rankingNameHeader && rankingDetailHeader) {
    rankingNameHeader.textContent = rankingMode === "drivers" ? "Piloto" : "Construtor";
    rankingDetailHeader.textContent = rankingMode === "drivers" ? "Equipe" : "Pilotos";
  }

  const rows =
    rankingMode === "drivers"
      ? drivers.map((driver) => ({
          name: driver.driver,
          detail: driver.team,
          points: driver.points,
          wins: driver.wins,
          podiums: driver.podiums
        }))
      : getConstructors(drivers);

  rankingBody.innerHTML = rows
    .map(
      (entry, index) => `
        <tr>
          <td><span class="position">${index + 1}</span></td>
          <td>${entry.name}</td>
          <td>${entry.detail}</td>
          <td><strong>${entry.points}</strong></td>
          <td>${entry.wins}</td>
          <td>${entry.podiums}</td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll(".series-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.series === seriesName);
    button.setAttribute("aria-selected", button.dataset.series === seriesName);
  });
}

function getConstructors(drivers) {
  const constructors = new Map();

  drivers.forEach((driver) => {
    const current = constructors.get(driver.team) ?? {
      name: driver.team,
      detail: [],
      points: 0,
      wins: 0,
      podiums: 0
    };

    current.detail.push(driver.driver);
    current.points += driver.points;
    current.wins += driver.wins;
    current.podiums += driver.podiums;
    constructors.set(driver.team, current);
  });

  return [...constructors.values()]
    .map((constructor) => ({
      ...constructor,
      detail: constructor.detail.join(", ")
    }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums);
}

function renderRankingModes() {
  if (!rankingModeButtons.length) {
    return;
  }

  rankingModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.rankingMode === rankingMode);
    button.addEventListener("click", () => {
      rankingMode = button.dataset.rankingMode;
      rankingModeButtons.forEach((modeButton) => {
        modeButton.classList.toggle("active", modeButton.dataset.rankingMode === rankingMode);
      });
      renderRanking(activeSeries);
    });
  });
}

function renderTabs() {
  if (!seriesTabs) {
    return;
  }

  seriesTabs.innerHTML = Object.keys(data.rankings)
    .map(
      (seriesName) => `
        <button type="button" role="tab" data-series="${seriesName}">
          ${seriesName}
        </button>
      `
    )
    .join("");

  seriesTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) {
      renderRanking(button.dataset.series);
    }
  });
}

function renderRaces() {
  if (nextRaceDate) {
    nextRaceDate.textContent = data.races[0]?.date ?? "--";
  }

  if (!raceList) {
    return;
  }

  raceList.innerHTML = data.races
    .map(
      (race) => `
        <article class="race-card">
          <div class="race-date">
            <strong>${race.date}</strong>
            <span>${race.time}</span>
          </div>
          <div>
            <h3>${race.track}</h3>
            <p>${race.series}</p>
            <span>${race.format}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderNews() {
  if (!newsGrid) {
    return;
  }

  newsGrid.innerHTML = data.news
    .map(
      (item) => `
        <article class="news-card">
          <span>${item.tag}</span>
          <h3>${item.title}</h3>
          <p>${item.body}</p>
        </article>
      `
    )
    .join("");
}

function renderLives() {
  if (liveKpis) {
    liveKpis.innerHTML = data.lives.totals
      .map(
        (item) => `
          <div>
            <strong>${item.value}</strong>
            <span>${item.label}</span>
          </div>
        `
      )
      .join("");
  }

  if (liveList) {
    liveList.innerHTML = data.lives.broadcasts
      .map(
        (broadcast) => `
          <article>
            <div>
              <h3>${broadcast.title}</h3>
              <p>${broadcast.channel} &middot; ${broadcast.views}</p>
            </div>
            <span>${broadcast.status}</span>
          </article>
        `
      )
      .join("");
  }
}

function renderRules() {
  if (!rulesGrid) {
    return;
  }

  rulesGrid.innerHTML = data.rules
    .map(
      (rule) => `
        <article class="rule-card">
          <h3>${rule.title}</h3>
          <p>${rule.body}</p>
        </article>
      `
    )
    .join("");
}

function renderSummary() {
  if (!totalDrivers) {
    return;
  }

  totalDrivers.textContent = Object.values(data.rankings).reduce(
    (count, drivers) => count + drivers.length,
    0
  );
}

markActivePage();
renderRankingModes();
renderTabs();
renderRanking("Serie A");
renderRaces();
renderNews();
renderLives();
renderRules();
renderSummary();
