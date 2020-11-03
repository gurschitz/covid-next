import puppeteer from "puppeteer";

type Keys =
  | "confirmedCases"
  | "deaths"
  | "recovered"
  | "hospitalized"
  | "icu"
  | "tests"
  | "total";

export type HealthMinistryData = {
  [k in Keys]: {
    key: k;
    timestamp?: string;
    "Bgld.": number;
    "Ktn.": number;
    NÖ: number;
    OÖ: number;
    "Sbg.": number;
    "Stmk.": number;
    T: number;
    "Vbg.": number;
    W: number;
    total: number;
  };
};

export default async function fetchHealthMinistryData(): Promise<
  HealthMinistryData
> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(
    "https://www.sozialministerium.at/Informationen-zum-Coronavirus/Neuartiges-Coronavirus-(2019-nCov).html"
  );

  // Get the "viewport" of the page, as reported by the page.
  const data = await page.evaluate(() => {
    const transformKeyMap: { [k: string]: string } = {
      "Bestätigte Fälle": "confirmedCases",
      Todesfälle: "deaths",
      Genesen: "recovered",
      Hospitalisierung: "hospitalized",
      Intensivstation: "icu",
      Testungen: "tests",
      "Österreich\ngesamt": "total",
    };

    function convertToDate(dateString: string) {
      const regex = /\(Stand (\d\d)\.(\d\d)\.(\d\d\d\d)\, (\d\d)\:(\d\d) Uhr\)/;
      const match = dateString.match(regex);
      if (match == null) {
        return null;
      }
      return new Date(
        parseInt(match[3]),
        parseInt(match[2]),
        parseInt(match[1]),
        parseInt(match[4]),
        parseInt(match[5])
      ).toISOString();
    }

    const headings = Array.from(
      document.querySelectorAll<HTMLElement>("[scope='col']")
    )
      .map((n) => n.innerText)
      .slice(1);

    const data = Array.from(
      document.querySelectorAll<HTMLElement>("[scope='row']")
    ).map((n) => {
      const row = n.innerText
        .split("\n")[0]
        .replace("°", "")
        .replace("*", "")
        .replace(/\(\d\)/, "");

      const timestamp = convertToDate(n.innerText.split("\n")[1]);

      const tds = Array.from(
        n.parentElement?.querySelectorAll<HTMLElement>("td") ?? []
      );

      const values = tds
        .map((td, i) => ({
          key: transformKeyMap[headings[i]] ?? headings[i],
          value: parseInt(td.innerText.replace(/\./g, "")),
        }))
        .reduce((acc, row) => {
          const data = {};
          data[row.key] = row.value;
          return Object.assign(acc, data);
        }, {});

      return Object.assign(
        {
          key: transformKeyMap[row],
          timestamp: timestamp,
        },
        values
      );
    });

    return data.reduce((acc, value) => {
      const returnValue = {};
      returnValue[value.key] = value;
      return Object.assign(acc, returnValue);
    }, {});
  });

  await browser.close();

  return data;
}
