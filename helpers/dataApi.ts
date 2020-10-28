import { parse, formatISO, format, isBefore, differenceInDays } from "date-fns";
import fetchAgesData from "./fetchAgesData";

const KEYS = {
  version: "VersionsNr",
  versionDate: "VersionsDate",
  daily: "tägliche Erkrankungen",
  deathcases: "Todesfälle",
  icuOccupancy: "Belegung Intensivbetten in %",
  sevenDay: "SiebenTageInzidenzFaelle",
  deathsPerDay: "AnzahlTotTaeglich",
  cases: "AnzahlFaelle",
  casesSum: "AnzahlFaelleSum",
  recoveredPerDay: "AnzahlGeheiltTaeglich",
  generalData: {
    lastUpdated: "LetzteAktualisierung",
    positiveTested: "PositivGetestet",
    deaths: "TotGemeldet",
    activeCases: "AktuelleErkrankungen",
    icu: "GesIBBel",
    hospitalized: "GesNBBel",
    allTests: "GesTestungen",
    recovered: "Genesen",
  },
  countryId: "BundeslandID",
  time: "Time",
  testsTotal: "TestGesamt",
  hospitalized: "FZHosp",
  icu: "FZICU",
  hospitalFree: "FZHospFree",
  icuFree: "FZICUFree",
  reportDate: "Meldedat",
};

const TOTAL_POP = 8901064;

function parseDateTime(time: string) {
  const isSummer = isBefore(
    parse(`${time} +02`, "dd.MM.yyyy HH:mm:ss X", new Date()),
    new Date(2020, 9, 25)
  );
  if (isSummer) {
    return parse(`${time} +02`, "dd.MM.yyyy HH:mm:ss X", new Date());
  } else {
    return parse(`${time} +01`, "dd.MM.yyyy HH:mm:ss X", new Date());
  }
}

function parseDate(day: string) {
  const isSummer = isBefore(
    parse(`${day} +02`, "dd.MM.yyyy X", new Date()),
    new Date(2020, 9, 25)
  );
  if (isSummer) {
    return parse(`${day} +02`, "dd.MM.yyyy X", new Date());
  } else {
    return parse(`${day} +01`, "dd.MM.yyyy X", new Date());
  }
}

const fetchDeathTimeline = () =>
  fetchAgesData("TodesfaelleTimeline").then((deaths) => {
    return deaths.map((row, i) => {
      const previousDeaths =
        i - 1 >= 0 ? parseInt(deaths[i - 1][KEYS.deathcases]) : 0;
      return {
        deathsPerDay: parseInt(row[KEYS.deathcases]) - previousDeaths,
        day: formatISO(parseDate(row.time)),
      };
    });
  });

const fetchHospitalAndTestData = () =>
  fetchAgesData("CovidFallzahlen")
    .then((rows) => {
      return rows
        .filter((row) => row[KEYS.countryId] === "10")
        .map((row) => ({
          tests: parseInt(row[KEYS.testsTotal]),
          hospitalized: parseInt(row[KEYS.hospitalized]),
          hospitalFree: parseInt(row[KEYS.hospitalFree]),
          icu: parseInt(row[KEYS.icu]),
          icuFree: parseInt(row[KEYS.icuFree]),
          hospitalOccupancy:
            parseInt(row[KEYS.hospitalized]) /
            (parseInt(row[KEYS.hospitalFree]) +
              parseInt(row[KEYS.hospitalized])),
          icuOccupancy:
            parseInt(row[KEYS.icu]) /
            (parseInt(row[KEYS.icuFree]) + parseInt(row[KEYS.icu])),
          day: formatISO(parseDate(row[KEYS.reportDate])),
        }));
    })
    .then((data) => {
      return data.map((v, i) => {
        const prevValue = i > 0 ? data[i - 1].tests : 0;
        const testsPerDay = v.tests - prevValue;
        return {
          ...v,
          testsPerDay,
        };
      });
    })
    .then((data) => {
      const sevenDay = data.slice(6).map((row, index) => {
        let sum = 0;
        for (let i = 1; i <= 7; i++) {
          const j = index + 7 - i;
          const value = data[j];
          sum = sum + value?.testsPerDay;
        }
        return {
          ...row,
          sevenDayAvgTests: Math.round(sum / 7),
        };
      });

      const reversedSevenDay = sevenDay.slice().reverse();

      return data
        .slice()
        .reverse()
        .map((row, i) => {
          return {
            ...row,
            ...reversedSevenDay[i],
          };
        })
        .slice()
        .reverse();
    });

const fetchIcuOccupancy = () =>
  fetchAgesData("IBAuslastung").then((icu) => {
    return icu.map((row) => ({
      occupancy: parseFloat(row[KEYS.icuOccupancy].replace(",", ".")),
      day: formatISO(parseDate(row.time)),
    }));
  });

const fetchEpicurve = () =>
  fetchAgesData("CovidFaelle_Timeline")
    .then((timeline) => {
      return timeline
        .filter((row) => row[KEYS.countryId] === "10")
        .map((row) => ({
          cases: parseInt(row[KEYS.cases]),
          casesSum: parseInt(row[KEYS.casesSum]),
          deathsPerDay: parseInt(row[KEYS.deathsPerDay]),
          sevenDay: parseInt(row[KEYS.sevenDay]),
          recoveredPerDay: parseInt(row[KEYS.recoveredPerDay]),
          day: parseDateTime(row[KEYS.time]),
        }));
    })
    .then((epicurve) => {
      const sevenDay = epicurve.slice(6).map((row, index) => {
        let casesSum = 0;
        for (let i = 1; i <= 7; i++) {
          const j = index + 7 - i;
          const cases = epicurve[j]?.cases;
          casesSum = casesSum + cases;
        }

        let deathSum = 0;
        for (let i = 0; i <= 7; i++) {
          deathSum = deathSum + epicurve[index + 7 - i]?.deathsPerDay;
        }

        return {
          ...row,
          sevenDayAvgCases: Math.round(casesSum / 7),
          sevenDayAvgCasesPer100: (
            (Math.round(casesSum / 7) / TOTAL_POP) *
            100000
          ).toPrecision(4),
          sevenDayCalculated: (casesSum / TOTAL_POP) * 100000,
          sevenDayDeaths: (deathSum / TOTAL_POP) * 100000,
        };
      });

      const reversedSevenDay = sevenDay.slice().reverse();

      const data = epicurve
        .slice()
        .reverse()
        .map((row, i) => {
          return {
            ...row,
            ...reversedSevenDay[i],
          };
        })
        .slice()
        .reverse();

      return data.map((row, index) => {
        const halfCases = row.sevenDayAvgCases / 2;
        let halfCasesRow: typeof row | null = null;

        for (let i = index; i >= 0; i--) {
          if (data[i].sevenDayAvgCases < halfCases) {
            break;
          }
          halfCasesRow = data[i];
        }

        return {
          ...row,
          day: formatISO(row.day),
          doubled: halfCasesRow
            ? differenceInDays(row.day, halfCasesRow.day)
            : 0,
        };
      });
    });

const fetchGeneralData = () =>
  fetchAgesData("AllgemeinDaten").then(([generalData]) => ({
    allInfections: parseInt(generalData[KEYS.generalData.positiveTested]),
    lastUpdated: formatISO(
      parseDateTime(generalData[KEYS.generalData.lastUpdated])
    ),
    deaths: parseInt(generalData[KEYS.generalData.deaths]),
    hospitalized: parseInt(generalData[KEYS.generalData.hospitalized]),
    icu: parseInt(generalData[KEYS.generalData.icu]),
    activeCases: parseInt(generalData[KEYS.generalData.activeCases]),
    allTests: parseInt(generalData[KEYS.generalData.allTests]),
    recovered: parseInt(generalData[KEYS.generalData.recovered]),
  }));

const fetchVersionData = () =>
  fetchAgesData("Version").then(([row]) => ({
    version: row[KEYS.version],
    versionDate: formatISO(parseDateTime(row[KEYS.versionDate])),
  }));

async function fetchTimeline() {
  const epicurve = await fetchEpicurve();
  const hospitalAndTestData = await fetchHospitalAndTestData();
  const reversedHospitalAndTestData = hospitalAndTestData.slice().reverse();
  const reversedEpicurve = epicurve.slice().reverse();
  const combinedData = reversedEpicurve
    .map((v, i) => ({
      ...v,
      ...reversedHospitalAndTestData[i],
    }))
    .reverse()
    .map((v) => {
      const cases = v.sevenDayAvgCases ?? 0;
      const tests = v.sevenDayAvgTests ?? 0;
      return {
        ...v,
        sevenDayAvgNegativeTests: tests - cases,
        positivityRate: tests > 0 ? cases / tests : 0,
      };
    });
  return combinedData;
}

export default {
  fetchTimeline,
  fetchGeneralData,
  fetchIcuOccupancy,
  fetchDeathTimeline,
  fetchVersionData,
};
