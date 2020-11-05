const unzipper = require("unzipper");
const csv = require("csv-parser");
const https = require("https");

const REQUEST_OPTIONS = {
  hostname: "info.gesundheitsministerium.at",
  port: 443,
  path: "/data/data.zip",
  method: "GET",
};

function fetchLegacyData(field: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let result: any[] = [];
    const req = https.request(REQUEST_OPTIONS, (res) => {
      res
        .pipe(unzipper.Parse())
        .on("entry", function (entry) {
          const fileName = entry.path;
          const type = entry.type;
          const id = fileName.replace(".csv", "");
          if (type === "File" && id === field) {
            entry.pipe(csv({ separator: ";" })).on("data", (row) => {
              const sanitizedRow = Object.keys(row).reduce((acc, k) => {
                return {
                  ...acc,
                  [k.trim()]: row[k],
                };
              }, {});
              result.push(sanitizedRow);
            });
          } else {
            entry.autodrain();
          }
        })
        .on("finish", () => resolve(result));
    });

    req.on("error", reject);
    req.end();
  });
}

export default fetchLegacyData;
