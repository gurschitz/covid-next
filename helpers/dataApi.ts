import { formatISO } from "date-fns";
import fetchAgesData from "./fetchAgesData";
import fetchHealthMinistryData from "./fetchHealthMinistryData";
import fetchLegacyData from "./fetchLegacyData";
import { parseDate, parseDateTime } from "./parsers";

const TOTAL_POP = 8901064;

export type GeneralData = {
  allCases: number;
  lastUpdated: string;
  deaths: number;
  hospitalized: number;
  icu: number;
  activeCases: number;
  allTests: number;
  recovered: number;
};

const GENERAL_DATA_KEYS = {
  lastUpdated: "LetzteAktualisierung",
  positiveTested: "PositivGetestet",
  deaths: "TotGemeldet",
  activeCases: "AktuelleErkrankungen",
  icu: "GesIBBel",
  hospitalized: "GesNBBel",
  allTests: "GesTestungen",
  recovered: "Genesen",
};

const fetchGeneralData = (): Promise<GeneralData> =>
  fetchLegacyData("AllgemeinDaten").then(([generalData]) => ({
    allCases: parseInt(generalData[GENERAL_DATA_KEYS.positiveTested]),
    lastUpdated: formatISO(
      parseDateTime(generalData[GENERAL_DATA_KEYS.lastUpdated])
    ),
    deaths: parseInt(generalData[GENERAL_DATA_KEYS.deaths]),
    hospitalized: parseInt(generalData[GENERAL_DATA_KEYS.hospitalized]),
    icu: parseInt(generalData[GENERAL_DATA_KEYS.icu]),
    activeCases: parseInt(generalData[GENERAL_DATA_KEYS.activeCases]),
    allTests: parseInt(generalData[GENERAL_DATA_KEYS.allTests]),
    recovered: parseInt(generalData[GENERAL_DATA_KEYS.recovered]),
  }));

const HOSPITAL_AND_TEST_TIMELINE_KEYS = {
  countryId: "BundeslandID",
  testsTotal: "TestGesamt",
  hospitalized: "FZHosp",
  hospitalFree: "FZHospFree",
  icu: "FZICU",
  icuFree: "FZICUFree",
  reportDate: "Meldedat",
};

type HospitalAndTestTimelineRow = {
  tests: number;
  hospitalized: number;
  hospitalFree: number;
  icu: number;
  icuFree: number;
  day: string;
  hospitalOccupancy: number;
  icuOccupancy: number;
  testsPerDay: number;
};

const fetchHospitalAndTestTimeline = (): Promise<
  HospitalAndTestTimelineRow[]
> =>
  fetchAgesData("CovidFallzahlen")
    .then((rows) => {
      return rows
        .filter(
          (row) => row[HOSPITAL_AND_TEST_TIMELINE_KEYS.countryId] === "10"
        )
        .map((row) => ({
          tests: parseInt(row[HOSPITAL_AND_TEST_TIMELINE_KEYS.testsTotal]),
          hospitalized: parseInt(
            row[HOSPITAL_AND_TEST_TIMELINE_KEYS.hospitalized]
          ),
          hospitalFree: parseInt(
            row[HOSPITAL_AND_TEST_TIMELINE_KEYS.hospitalFree]
          ),
          icu: parseInt(row[HOSPITAL_AND_TEST_TIMELINE_KEYS.icu]),
          icuFree: parseInt(row[HOSPITAL_AND_TEST_TIMELINE_KEYS.icuFree]),
          day: formatISO(
            parseDate(row[HOSPITAL_AND_TEST_TIMELINE_KEYS.reportDate])
          ),
        }));
    })
    .then((data) => {
      return data.map((v, i) => {
        const prevValue = i > 0 ? data[i - 1].tests : 0;
        const testsPerDay = v.tests - prevValue;
        return {
          ...v,
          hospitalOccupancy: v.hospitalized / (v.hospitalFree + v.hospitalized),
          icuOccupancy: v.icu / (v.icuFree + v.icu),
          testsPerDay,
        };
      });
    });

const KEYS = {
  sevenDay: "SiebenTageInzidenzFaelle",
  deathsPerDay: "AnzahlTotTaeglich",
  cases: "AnzahlFaelle",
  casesSum: "AnzahlFaelleSum",
  recoveredPerDay: "AnzahlGeheiltTaeglich",
  countryId: "BundeslandID",
  time: "Time",
};

type CasesTimelineRow = {
  cases: number;
  casesSum: number;
  deathsPerDay: number;
  sevenDay: number;
  recoveredPerDay: number;
  day: string;
};

const fetchCasesTimeline = (): Promise<CasesTimelineRow[]> =>
  fetchAgesData("CovidFaelle_Timeline").then((timeline) => {
    return timeline
      .filter((row) => row[KEYS.countryId] === "10")
      .map((row) => ({
        cases: parseInt(row[KEYS.cases]),
        casesSum: parseInt(row[KEYS.casesSum]),
        deathsPerDay: parseInt(row[KEYS.deathsPerDay]),
        sevenDay: parseInt(row[KEYS.sevenDay]),
        recoveredPerDay: parseInt(row[KEYS.recoveredPerDay]),
        day: formatISO(parseDateTime(row[KEYS.time])),
      }));
  });

export type VersionData = {
  version: string;
  versionDate: string;
  creationDate: string;
};

const VERSION_KEYS = {
  version: "VersionsNr",
  versionDate: "VersionsDate",
  creationDate: "CreationDate",
};

const fetchVersionData = (): Promise<VersionData> =>
  fetchAgesData("Version").then(([row]) => ({
    version: row[VERSION_KEYS.version],
    versionDate: formatISO(parseDateTime(row[VERSION_KEYS.versionDate])),
    creationDate: formatISO(parseDateTime(row[VERSION_KEYS.creationDate])),
  }));

async function fetchCombinedTimeline(): Promise<
  (CasesTimelineRow & HospitalAndTestTimelineRow)[]
> {
  const casesTimeline = await fetchCasesTimeline();
  const hospitalAndTestTimeline = await fetchHospitalAndTestTimeline();
  const reversedHospitalAndTestTimeline = hospitalAndTestTimeline
    .slice()
    .reverse();
  const reversedTimeline = casesTimeline.slice().reverse();
  return reversedTimeline
    .map((v, i) => {
      return {
        ...v,
        ...reversedHospitalAndTestTimeline[i],
      };
    })
    .reverse();
}

type CalculatedRow = {
  sevenDayAvgTests: number;
  sevenDayAvgCases: number;
  sevenDayCalculated: number;
  sevenDayDeaths: number;
  sevenDayAvgNegativeTests: number;
  positivityRate: number;
};

export type TimelineRow = CasesTimelineRow &
  HospitalAndTestTimelineRow &
  CalculatedRow;

async function fetchTimeline(): Promise<TimelineRow[]> {
  return await fetchCombinedTimeline().then((timeline) => {
    const sevenDay = timeline.slice(6).map((row, index) => {
      const testsSum = timeline
        .slice(index, index + 7)
        .reduce((acc, val) => acc + val.testsPerDay, 0);

      const casesSum = timeline
        .slice(index, index + 7)
        .reduce((acc, val) => acc + val.cases, 0);

      const deathSum = timeline
        .slice(index, index + 7)
        .reduce((acc, val) => acc + val.deathsPerDay, 0);

      const sevenDayAvgTests = Math.round(testsSum / 7);
      const sevenDayAvgCases = Math.round(casesSum / 7);
      const sevenDayCalculated = (casesSum / TOTAL_POP) * 100000;
      const sevenDayDeaths = (deathSum / TOTAL_POP) * 100000;

      const sevenDayAvgNegativeTests = sevenDayAvgTests - sevenDayAvgCases;
      const positivityRate =
        sevenDayAvgTests > 0 ? sevenDayAvgCases / sevenDayAvgTests : 0;

      return {
        ...row,
        sevenDayAvgTests,
        sevenDayAvgCases,
        sevenDayCalculated,
        sevenDayDeaths,
        sevenDayAvgNegativeTests,
        positivityRate,
      };
    });

    const reversedSevenDay = sevenDay.slice().reverse();

    return timeline
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
}

export default {
  fetchTimeline,
  fetchHealthMinistryData,
  fetchVersionData,
  fetchGeneralData,
};
