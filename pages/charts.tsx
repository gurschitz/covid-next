import dataApi from "../helpers/dataApi";
import {
  ComposedChart,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Header from "../components/Header";

export async function getStaticProps(context) {
  const epicurve = await dataApi.fetchEpicurve();
  const generalData = await dataApi.fetchGeneralData();
  const hospitalAndTestData = await dataApi.fetchHospitalAndTestData();
  return {
    props: { epicurve, hospitalAndTestData, generalData },
  };
}

const CHART_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

const COLORS = {
  blue: {
    light: "#bee3f8",
    medium: "#4299e1",
    dark: "#2a4365",
  },
  gray: {
    light: "#cbd5e0",
    medium: "#a0aec0",
    dark: "#1a202c",
  },
  yellow: {
    medium: "#d69e2e",
    dark: "#975a16",
  },
  red: {
    light: "#feb2b2",
    medium: "#f56565",
    dark: "#9b2c2c",
  },
};

function parseAndFormatDate(day: string, dateFormat: string) {
  return format(parseISO(day), dateFormat);
}

function ChartHeader({ children }) {
  return (
    <h2 className="text-2xl text-gray-700 mb-2 text-center">{children}</h2>
  );
}

const CHART_HEIGHT = 200;

interface ChartWithData {
  data: any[];
}

function CasesChart({ data }: ChartWithData) {
  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const { cases, sevenDayCalculated, day } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, "dd.MM.yyy")}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">Fälle</div>
                      <div className="font-bold">{cases}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs">7-Tage-Inzidenz</div>
                      <div className="font-bold">
                        {sevenDayCalculated?.toFixed(2) ?? 0}
                      </div>
                      <div className="text-xs">per 100.000 Einwohner</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar yAxisId="left" dataKey="cases" fill={COLORS.gray.light} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sevenDayCalculated"
          stroke={COLORS.blue.dark}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function TestsChart({ data }: ChartWithData) {
  const testData = data.map((v) => {
    const cases = v.sevenDayAvgCases ?? 0;
    const tests = v.sevenDayAvgTests ?? 0;
    return {
      ...v,
      sevenDayAvgNegativeTests: tests - cases,
      positivityRate: tests > 0 ? cases / tests : 0,
    };
  });
  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={testData} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const {
              positivityRate,
              sevenDayAvgTests,
              day,
            } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, "dd.MM.yyy")}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">Positivitätsrate</div>
                      <div className="font-bold">
                        {(positivityRate * 100)?.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">Tests 7-Tage-Mittel</div>
                      <div className="font-bold">
                        {sevenDayAvgTests?.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="sevenDayAvgCases"
          stackId="a"
          fill={COLORS.blue.dark}
        />
        <Bar
          yAxisId="left"
          dataKey="sevenDayAvgNegativeTests"
          stackId="a"
          fill={COLORS.gray.light}
        />

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="positivityRate"
          stroke={COLORS.red.dark}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function HospitalChart({ data }: ChartWithData) {
  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const {
              hospitalized,
              hospitalFree,
              hospitalOccupancy,
              day,
            } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, "dd.MM.yyy")}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">Belegt</div>
                      <div className="font-bold">{hospitalized}</div>
                    </div>
                    <div>
                      <div className="text-xs">Frei</div>
                      <div className="font-bold">{hospitalFree}</div>
                    </div>
                    <div>
                      <div className="text-xs">Auslastung</div>
                      <div className="font-bold">{`${(
                        hospitalOccupancy * 100
                      ).toFixed(2)}%`}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="hospitalized"
          stackId="a"
          fill={COLORS.yellow.medium}
        />
        <Bar
          yAxisId="left"
          dataKey="hospitalFree"
          stackId="a"
          fill={COLORS.gray.light}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="hospitalOccupancy"
          stroke={COLORS.yellow.dark}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ICUChart({ data }: ChartWithData) {
  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const { icu, icuFree, icuOccupancy, day } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, "dd.MM.yyy")}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">Belegt</div>
                      <div className="font-bold">{icu}</div>
                    </div>
                    <div>
                      <div className="text-xs">Frei</div>
                      <div className="font-bold">{icuFree}</div>
                    </div>
                    <div>
                      <div className="text-xs">Auslastung</div>
                      <div className="font-bold">{`${(
                        icuOccupancy * 100
                      ).toFixed(2)}%`}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="icu"
          stackId="a"
          fill={COLORS.red.medium}
        />
        <Bar
          yAxisId="left"
          dataKey="icuFree"
          stackId="a"
          fill={COLORS.gray.light}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="icuOccupancy"
          stroke={COLORS.red.dark}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function DeathsChart({ data }: ChartWithData) {
  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="right" orientation="right" hide />
        <YAxis yAxisId="left" orientation="left" />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const { sevenDayDeaths, day, deathsPerDay } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <div className="text-lg">
                    <div>
                      Todesfälle:
                      <span className="font-bold">{deathsPerDay}</span>{" "}
                    </div>
                    <div>{sevenDayDeaths?.toFixed(2)} 7-Tage-Inzidenz</div>
                  </div>
                  <p className="text-sm">
                    {parseAndFormatDate(day, "dd.MM.yyy")}
                  </p>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar yAxisId="left" dataKey="deathsPerDay" fill={COLORS.gray.light} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sevenDayDeaths"
          stroke={COLORS.gray.dark}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function Charts({ epicurve, hospitalAndTestData }) {
  const reversedHospitalAndTestData = hospitalAndTestData.slice().reverse();
  const reversedEpicurve = epicurve.slice().reverse();

  const combinedData = reversedHospitalAndTestData
    .map((v, i) => ({
      ...v,
      ...reversedEpicurve[i],
    }))
    .reverse();

  return (
    <div className="px-3 py-4 lg:px-4 space-y-12">
      <div>
        <ChartHeader>Erkrankungen</ChartHeader>
        <CasesChart data={epicurve} />
      </div>

      <div>
        <ChartHeader>Testungen</ChartHeader>
        <TestsChart data={combinedData} />
      </div>

      <div>
        <ChartHeader>Spital (ohne Intensiv)</ChartHeader>
        <HospitalChart data={hospitalAndTestData} />
      </div>

      <div>
        <ChartHeader>Intensiv</ChartHeader>
        <ICUChart data={hospitalAndTestData} />
      </div>

      <div>
        <ChartHeader>Todesfälle</ChartHeader>
        <DeathsChart data={epicurve} />
      </div>
    </div>
  );
}

export default function Home({ epicurve, generalData, hospitalAndTestData }) {
  return (
    <div className="container mx-auto">
      <Header lastUpdated={generalData.lastUpdated} />
      <Nav />
      <Charts epicurve={epicurve} hospitalAndTestData={hospitalAndTestData} />
      <Footer />
    </div>
  );
}
