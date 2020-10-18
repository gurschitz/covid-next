import dataApi from "../helpers/dataApi";
import {
  ComposedChart,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  Bar,
  ResponsiveContainer,
  BarChart,
} from "recharts";
import classNames from "classnames";
import { format, parseISO, isToday } from "date-fns";
import { Router, Switch, Route, NavLink } from "react-router-dom";
import { createMemoryHistory } from "history";

const history = createMemoryHistory();

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

function Number({ children, className }) {
  return (
    <div
      className={classNames(
        "rounded-lg overflow-hidden flex flex-col lg:flex-row items-center lg:items-end justify-center relative text-center",
        className
      )}
    >
      {children}
    </div>
  );
}

Number.Value = ({ children, label, delta = null, className = null }) => (
  <div className={classNames("p-2 lg:p-4", className)}>
    <div className="flex items-baseline justify-center py-2">
      <div className="font-bold text-2xl lg:text-4xl leading-none">
        {children}
      </div>
      {delta && delta !== 0 ? (
        <div className="text-sm lg:text-lg leading-none -mr-2 pl-2 w-0">
          {delta > 0 ? "+" : "-"}
          {delta}
        </div>
      ) : null}
    </div>

    <div className="text-center z-20 text-sm lg:text-base">{label}</div>
  </div>
);

Number.Chart = ({ data, dataKey, color }) => (
  <div className="h-24 w-full lg:w-3/5">
    <ResponsiveContainer>
      <BarChart margin={CHART_MARGINS} data={data}>
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const value = payload[0].payload[dataKey];
            const dayISO = payload[0].payload?.day;
            return (
              <div className="relative">
                <div className="p-1 z-20 relative text-center">
                  {dayISO && (
                    <p className="text-sm">
                      {parseAndFormatDate(dayISO, "dd.MM.yyy")}
                    </p>
                  )}

                  <div className="font-bold">{value}</div>
                </div>
                <div className="bg-gray-300 opacity-75 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />

        <Bar
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.9}
          strokeWidth={0}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

function NewInfections({ generalData, epicurve }) {
  const lastEntry = epicurve[epicurve.length - 1];
  const day = parseISO(lastEntry?.day);
  const today = new Date();
  const shouldUseLastUpdate = today > day;

  const previouslyInfected = epicurve
    .slice(0, shouldUseLastUpdate ? epicurve.length : epicurve.length - 1)
    .reduce((acc, v) => acc + v.cases, 0);
  const newInfections = generalData.allInfections - previouslyInfected;
  let label = null;
  if (shouldUseLastUpdate) {
    label = "neue Fälle seit dem letztem AGES-Update";
  } else if (day) {
    label = `neue Fälle seit ${format(day, "dd.MM.yyy")} 00:00 Uhr`;
  }

  return (
    <Number className="bg-blue-100 text-blue-900">
      <Number.Value className="lg:w-2/5" label={label}>
        {newInfections}
      </Number.Value>

      <Number.Chart
        data={epicurve.slice().reverse().slice(0, 14).reverse()}
        dataKey="cases"
        color={COLORS.blue.dark}
      />
    </Number>
  );
}

function CurrentValueWithHistory({
  data,
  label,
  value,
  dataKey,
  color,
  className = null,
  calculateDiff = false,
}) {
  const last14Days = data.slice().reverse().slice(0, 14).reverse();
  const lastValueIsToday = isToday(
    parseISO(last14Days[last14Days.length - 1].day)
  );
  const prevValue = lastValueIsToday
    ? last14Days[last14Days.length - 2][dataKey]
    : last14Days[last14Days.length - 1][dataKey];
  const diffBasis = lastValueIsToday
    ? last14Days[last14Days.length - 1][dataKey]
    : value;
  const currentValue = last14Days[last14Days.length - 1][dataKey];

  return (
    <Number className={className}>
      <Number.Value
        className="lg:w-2/5"
        delta={calculateDiff ? diffBasis - prevValue : currentValue}
        label={label}
      >
        {value}
      </Number.Value>

      <Number.Chart data={last14Days} dataKey={dataKey} color={color} />
    </Number>
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

function Dashboard({ generalData, epicurve, hospitalAndTestData }) {
  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-2 lg:gap-4 py-1 px-3 lg:py-4 lg:px-4">
        <NewInfections generalData={generalData} epicurve={epicurve} />

        <CurrentValueWithHistory
          className="bg-yellow-100 text-yellow-900"
          data={hospitalAndTestData}
          label="Spital (ohne Intensiv)"
          value={generalData.hospitalized}
          dataKey="hospitalized"
          color={COLORS.yellow.dark}
          calculateDiff
        />
        <CurrentValueWithHistory
          className="bg-red-100 text-red-900"
          data={hospitalAndTestData}
          label="Intensiv"
          value={generalData.icu}
          dataKey="icu"
          color={COLORS.red.dark}
          calculateDiff
        />
        <CurrentValueWithHistory
          className="bg-gray-200 text-gray-900"
          data={epicurve}
          label="Todesfälle"
          value={epicurve.reduce((acc, v) => v.deathsPerDay + acc, 0)}
          dataKey="deathsPerDay"
          color={COLORS.gray.dark}
        />
      </div>
      <div className="grid lg:grid-cols-3 gap-2 lg:gap-4 py-1 px-2 lg:py-4 lg:px-4">
        <Number className="bg-gray-200 text-gray-900">
          <Number.Value label="positiv getestet">
            {generalData.allInfections}
          </Number.Value>
        </Number>
        <Number className="bg-gray-200 text-gray-900">
          <Number.Value label="aktive Fälle">
            {generalData.activeCases}
          </Number.Value>
        </Number>
        <Number className="bg-gray-200 text-gray-900">
          <Number.Value label="Testungen">{generalData.allTests}</Number.Value>
        </Number>
      </div>
    </div>
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
      <div className="py-4">
        <h1 className="text-center text-gray-700 text-3xl lg:text-4xl">
          COVID-19 Österreich
        </h1>
        <div className="text-center text-gray-600">
          Letztes Update: {generalData.lastUpdated}
        </div>
      </div>

      <Router history={history}>
        <nav className="flex justify-center py-4">
          <ul className="flex space-x-3">
            <li>
              <NavLink
                activeClassName="bg-blue-900 text-white"
                className="bg-gray-200 px-4 py-2 rounded focus:outline-none focus:shadow-outline"
                to="/"
                exact
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                activeClassName="bg-blue-900 text-white"
                className="bg-gray-200 px-4 py-2 rounded focus:outline-none focus:shadow-outline"
                to="/charts"
              >
                Charts
              </NavLink>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route path="/charts">
            <Charts
              epicurve={epicurve}
              hospitalAndTestData={hospitalAndTestData}
            />
          </Route>
          <Route path="/">
            <Dashboard
              generalData={generalData}
              epicurve={epicurve}
              hospitalAndTestData={hospitalAndTestData}
            />
          </Route>
        </Switch>
      </Router>

      <div className="text-center pt-5 pb-10 text-gray-600">
        Umsetzung von{" "}
        <a
          className="text-blue-500"
          target="_blank"
          rel="noopener noreferrer"
          href="https://twitter.com/GeraldUrschitz"
        >
          Gerald Urschitz
        </a>
      </div>
    </div>
  );
}
