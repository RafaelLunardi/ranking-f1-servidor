const data = window.championshipData;

const seriesTabs = document.querySelector("#seriesTabs");
const championshipButtons = document.querySelectorAll("[data-championship]");
const rankingModeButtons = document.querySelectorAll("[data-ranking-mode]");
const rankingBody = document.querySelector("#rankingBody");
const activeSeriesTitle = document.querySelector("#activeSeriesTitle");
const activeSeriesInfo = document.querySelector("#activeSeriesInfo");
const rankingNameHeader = document.querySelector("#rankingNameHeader");
const rankingDetailHeader = document.querySelector("#rankingDetailHeader");
const rankingMetricOneHeader = document.querySelector("#rankingMetricOneHeader");
const rankingMetricTwoHeader = document.querySelector("#rankingMetricTwoHeader");
const totalDrivers = document.querySelector("#totalDrivers");
const nextRaceDate = document.querySelector("#nextRaceDate");
const raceList = document.querySelector("#raceList");
const newsGrid = document.querySelector("#newsGrid");
const liveKpis = document.querySelector("#liveKpis");
const liveList = document.querySelector("#liveList");
const rulesGrid = document.querySelector("#rulesGrid");

let activeSeries = "Serie A";
let rankingMode = "drivers";
let activeChampionship = championshipButtons.length
  ? localStorage.getItem("activeChampionship") || "f2"
  : "f2";
const loadedSheets = new Set();

const emptyChampionshipData = {
  rankings: {
    "Serie A": [],
    "Serie B": [],
    "Serie C": [],
    "Serie D": [],
    "Serie E": [],
    "Serie F": [],
    "Serie G": []
  },
  races: [],
  news: [],
  lives: {
    totals: [
      { label: "Lives feitas", value: "0" },
      { label: "Media de viewers", value: "0" },
      { label: "Horas transmitidas", value: "0h" }
    ],
    broadcasts: []
  }
};

function applySheetSnapshot() {
  const snapshot = window.sheetData?.[activeChampionship];
  if (activeChampionship === "f2" && snapshot?.rankings) {
    Object.assign(data.rankings, snapshot.rankings);
  }
}

function getActiveData() {
  return activeChampionship === "f2" ? data : emptyChampionshipData;
}

function getChampionshipLabel() {
  return activeChampionship.toUpperCase();
}

function parseCsv(csvText) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function flagCodeToCountry(flagCode) {
  const code = flagCode.replaceAll(":", "").replace("flag_", "").toUpperCase();
  const countries = {
    AR: "ARG",
    AU: "AUS",
    BR: "BRA",
    CA: "CAN",
    CH: "SUI",
    CL: "CHI",
    CO: "COL",
    CZ: "CZE",
    ES: "ESP",
    FI: "FIN",
    FR: "FRA",
    GB: "GBR",
    GH: "GHA",
    MX: "MEX",
    NL: "NED",
    TH: "THA",
    TR: "TUR",
    US: "USA",
    UY: "URU"
  };

  return countries[code] || code || "???";
}

function flagCodeToEmoji(flagCode) {
  const code = flagCode.replaceAll(":", "").replace("flag_", "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    return "";
  }

  return [...code].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
}

function parseNumber(value) {
  return Number(String(value).replace("%", "").replace(".", "").replace(",", ".")) || 0;
}

function cleanMovement(value) {
  return String(value).replaceAll("*", "").trim();
}

function formatPoints(value) {
  const normalized = String(value).trim();
  return normalized.includes(",") ? normalized : normalized.replace(".", ",");
}

function getMovementParts(value) {
  const movement = String(value || "").trim();
  const rawSymbol = movement.match(/[🔼⏫▲⬆️🔽▼⬇️◀️➡️=]/u)?.[0] || "=";
  const label = movement.replace(/[🔼⏫▲⬆️🔽▼⬇️◀️➡️]/gu, "").trim() || "= 0";
  let direction = "same";
  let symbol = rawSymbol;

  if (/🔼|⏫|▲|⬆️|\+\s*\d/.test(movement)) {
    direction = "up";
    symbol = "▲";
  } else if (/🔽|▼|⬇️|-\s*\d/.test(movement)) {
    direction = "down";
    symbol = "▼";
  } else {
    symbol = "▶";
  }

  return { direction, label, symbol };
}

function emojiToFlagCode(emoji) {
  if (!emoji) return "";
  try {
    return [...emoji]
      .map((c) => String.fromCharCode(c.codePointAt(0) - 0x1f1e6 + 65))
      .join("")
      .toLowerCase();
  } catch {
    return "";
  }
}

function renderCountry(country, flag) {
  if (!country && !flag) {
    return "";
  }

  const code = emojiToFlagCode(flag);
  const flagHtml = code
    ? `<img class="country-flag-img" src="https://flagcdn.com/w20/${code}.png" alt="${country ?? ""}">`
    : `<span class="country-flag">${flag ?? ""}</span>`;

  return `
    <span class="country-cell">
      ${flagHtml}
      <span>${country ?? ""}</span>
    </span>
  `;
}

function renderMovement(movement) {
  const { direction, label, symbol } = getMovementParts(movement);

  return `
    <span class="movement-cell">
      <span class="movement-badge ${direction}">${symbol}</span>
      <span>${label} NC</span>
    </span>
  `;
}

function mapSheetRankingRows(csvRows) {
  return csvRows
    .slice(1)
    .filter((row) => row[1] && row[1] !== "#N/A")
    .map((row, index) => {
      const flagCode = row[2] || "";

      return {
        position: String((index % 20) + 1).padStart(2, "0"),
        driver: row[1],
        country: flagCodeToCountry(flagCode),
        flag: flagCodeToEmoji(flagCode),
        team: "Sem construtor",
        points: parseNumber(row[5]),
        pointsLabel: formatPoints(row[5]),
        movement: cleanMovement(row[6] || ""),
        nc: parseNumber(row[8]),
        dnf: row[7] || "-"
      };
    });
}

function splitRowsIntoSeries(rows) {
  const seriesNames = ["Serie A", "Serie B", "Serie C", "Serie D", "Serie E", "Serie F", "Serie G"];

  return seriesNames.reduce((rankings, seriesName, index) => {
    rankings[seriesName] = rows.slice(index * 20, index * 20 + 20);
    return rankings;
  }, {});
}

async function loadSheetRankings() {
  const sources = data.sheetSources?.[activeChampionship]?.rankings;
  if (!sources) {
    return;
  }

  await Promise.all(
    Object.entries(sources).map(async ([seriesName, url]) => {
      const key = `${activeChampionship}:${seriesName}`;
      if (loadedSheets.has(key)) {
        return;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Falha ao carregar ${seriesName}`);
      }

      const csvText = await response.text();
      const rows = mapSheetRankingRows(parseCsv(csvText));
      if (rows.length) {
        Object.assign(data.rankings, splitRowsIntoSeries(rows));
        loadedSheets.add(key);
      }
    })
  );
}

async function refreshFromSheets() {
  try {
    await loadSheetRankings();
      renderTabs();
      renderRanking(activeSeries);
      renderSummary();
  } catch (error) {
    console.warn("Nao foi possivel carregar dados do Google Sheets.", error);
  }
}

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

function renderChampionshipSwitches() {
  if (!championshipButtons.length) {
    return;
  }

  championshipButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.championship === activeChampionship);
    button.addEventListener("click", () => {
      activeChampionship = button.dataset.championship;
      localStorage.setItem("activeChampionship", activeChampionship);

      championshipButtons.forEach((championshipButton) => {
        championshipButton.classList.toggle(
          "active",
          championshipButton.dataset.championship === activeChampionship
        );
      });

      renderTabs();
      renderRanking(activeSeries);
      renderRaces();
      renderNews();
      renderLives();
      renderSummary();
      refreshFromSheets();
    });
  });
}

function renderEmptyRow(message) {
  return `
    <tr>
      <td colspan="6" class="empty-table">${message}</td>
    </tr>
  `;
}

function renderRanking(seriesName) {
  if (!rankingBody || !activeSeriesTitle || !activeSeriesInfo) {
    return;
  }

  const championshipData = getActiveData();
  if (!championshipData.rankings[seriesName]) {
    seriesName = Object.keys(championshipData.rankings)[0];
  }

  activeSeries = seriesName;
  const drivers = championshipData.rankings[seriesName];
  const hasPilotStats = drivers.some((driver) => driver.dnf || driver.nc !== undefined);
  activeSeriesTitle.textContent = `${getChampionshipLabel()} ${seriesName}`;
  activeSeriesInfo.textContent =
    rankingMode === "drivers"
      ? `${drivers.length} pilotos classificados nesta divisao`
      : `${getConstructors(drivers).length} construtores classificados nesta divisao`;

  if (rankingNameHeader && rankingDetailHeader && rankingMetricOneHeader && rankingMetricTwoHeader) {
    rankingNameHeader.textContent = rankingMode === "drivers" ? "Piloto" : "Construtor";
    rankingDetailHeader.textContent =
      rankingMode === "drivers" ? (hasPilotStats ? "Pais" : "Equipe") : "Pilotos";
    rankingMetricOneHeader.textContent =
      rankingMode === "drivers" ? (hasPilotStats ? "NC" : "Vitorias") : "NC";
    rankingMetricTwoHeader.textContent =
      rankingMode === "drivers" ? (hasPilotStats ? "DNF" : "Podios") : "DNF";
  }

  const rows =
    rankingMode === "drivers"
      ? drivers.map((driver) => ({
          position: driver.position,
          name: driver.driver,
          detail: driver.country ? renderCountry(driver.country, driver.flag) : driver.team,
          points: driver.points,
          pointsLabel: driver.pointsLabel,
          metricOne:
            driver.nc !== undefined ? renderMovement(driver.movement) : driver.wins,
          metricTwo: driver.dnf ?? driver.podiums
        }))
      : getConstructors(drivers);

  rankingBody.innerHTML = rows.length
    ? rows
        .map(
          (entry, index) => `
            <tr>
              <td><span class="position">${entry.position ?? index + 1}</span></td>
              <td>${entry.name}</td>
              <td>${entry.detail}</td>
              <td><strong>${entry.pointsLabel ?? entry.points}</strong></td>
              <td>${entry.metricOne}</td>
              <td>${entry.metricTwo}</td>
            </tr>
          `
        )
        .join("")
    : renderEmptyRow(`Ainda nao ha dados da ${getChampionshipLabel()} nesta serie.`);

  document.querySelectorAll(".series-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.series === seriesName);
    button.setAttribute("aria-selected", button.dataset.series === seriesName);
  });
}

function getConstructors(drivers) {
  const constructors = new Map();

  drivers.forEach((driver) => {
    const constructorName = driver.constructor ?? driver.team ?? "Sem construtor";
    const current = constructors.get(constructorName) ?? {
      name: constructorName,
      detail: [],
      points: 0,
      nc: 0,
      dnfValues: []
    };

    current.detail.push(driver.driver);
    current.points += driver.points;
    current.nc += driver.nc ?? driver.wins ?? 0;
    if (driver.dnf) {
      current.dnfValues.push(Number(driver.dnf.replace("%", "").replace(",", ".")));
    }
    constructors.set(constructorName, current);
  });

  return [...constructors.values()]
    .map((constructor) => ({
      name: constructor.name,
      detail: constructor.detail.join(", "),
      points: constructor.points,
      pointsLabel: constructor.points.toFixed(2).replace(".", ","),
      metricOne: `${constructor.nc} NC`,
      metricTwo: constructor.dnfValues.length
        ? `${(
            constructor.dnfValues.reduce((total, value) => total + value, 0) /
            constructor.dnfValues.length
          )
            .toFixed(1)
            .replace(".", ",")}%`
        : "-"
    }))
    .sort((a, b) => b.points - a.points);
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

  const championshipData = getActiveData();
  seriesTabs.innerHTML = Object.keys(championshipData.rankings)
    .map(
      (seriesName) => `
        <button type="button" role="tab" data-series="${seriesName}">
          ${seriesName}
        </button>
      `
    )
    .join("");

  seriesTabs.onclick = (event) => {
    const button = event.target.closest("button");
    if (button) {
      renderRanking(button.dataset.series);
    }
  };
}

function renderRaces() {
  const championshipData = getActiveData();
  if (nextRaceDate) {
    nextRaceDate.textContent = championshipData.races[0]?.date ?? "--";
  }

  if (!raceList) {
    return;
  }

  raceList.innerHTML = championshipData.races.length
    ? championshipData.races
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
        .join("")
    : `<article class="empty-card">Ainda nao ha corridas da ${getChampionshipLabel()} cadastradas.</article>`;
}

function renderNews() {
  if (!newsGrid) {
    return;
  }

  const championshipData = getActiveData();
  newsGrid.innerHTML = championshipData.news.length
    ? championshipData.news
        .map(
          (item) => `
            <article class="news-card">
              <span>${item.tag}</span>
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </article>
          `
        )
        .join("")
    : `<article class="empty-card">Ainda nao ha noticias da ${getChampionshipLabel()} cadastradas.</article>`;
}

function renderLives() {
  const championshipData = getActiveData();
  if (liveKpis) {
    liveKpis.innerHTML = championshipData.lives.totals
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
    liveList.innerHTML = championshipData.lives.broadcasts.length
      ? championshipData.lives.broadcasts
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
          .join("")
      : `<article class="empty-card">Ainda nao ha lives da ${getChampionshipLabel()} cadastradas.</article>`;
  }
}

function renderRules() {
  if (!rulesGrid) {
    return;
  }

  rulesGrid.innerHTML = data.rules
    .map((rule) => {
      if (rule.items) {
        return `
          <article class="rule-section">
            <h3>${rule.title}</h3>
            <div class="rule-list">
              ${rule.items
                .map(
                  (item) => `
                    <div class="rule-row">
                      <strong>${item.code}</strong>
                      <p>${item.body}</p>
                    </div>
                  `
                )
                .join("")}
            </div>
          </article>
        `;
      }

      return `
        <article class="rule-card">
          <h3>${rule.title}</h3>
          <p>${rule.body}</p>
        </article>
      `;
    })
    .join("");
}

function renderSummary() {
  if (!totalDrivers) {
    return;
  }

  const championshipData = getActiveData();
  totalDrivers.textContent = Object.values(championshipData.rankings).reduce(
    (count, drivers) => count + drivers.length,
    0
  );
}

markActivePage();
applySheetSnapshot();
renderChampionshipSwitches();
renderRankingModes();
renderTabs();
renderRanking("Serie A");
renderRaces();
renderNews();
renderLives();
renderRules();
renderSummary();
refreshFromSheets();
