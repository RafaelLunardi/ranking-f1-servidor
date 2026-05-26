const fs = require("fs/promises");

const sheetUrl =
  "https://docs.google.com/spreadsheets/d/1KWkrcpZXpvO2Cj8rc1_v9B9xr2QMRtbN_bSitTcaAl8/gviz/tq?tqx=out:csv&gid=0";

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

async function main() {
  const response = await fetch(sheetUrl);
  if (!response.ok) {
    throw new Error(`Google Sheets retornou ${response.status}`);
  }

  const csvText = await response.text();
  const rows = mapSheetRankingRows(parseCsv(csvText));
  const payload = {
    updatedAt: new Date().toISOString(),
    f2: {
      rankings: splitRowsIntoSeries(rows)
    }
  };

  await fs.writeFile(
    "sheet-data.js",
    `window.sheetData = ${JSON.stringify(payload, null, 2)};\n`,
    "utf8"
  );

  console.log(`Atualizado sheet-data.js com ${rows.length} pilotos.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
