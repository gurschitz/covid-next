import dataApi from "../helpers/dataApi";
import {
  AreaChart,
  Tooltip,
  Area,
  Bar,
  ResponsiveContainer,
  BarChart,
  YAxis,
} from "recharts";
import classNames from "classnames";
import { format, parseISO, isToday } from "date-fns";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { COLORS } from "../helpers/constants";

export const CHART_MARGINS = { top: 10, bottom: 0, left: 0, right: 0 };

async function fetchCombinedData() {
  const epicurve = await dataApi.fetchEpicurve();
  const hospitalAndTestData = await dataApi.fetchHospitalAndTestData();
  const reversedHospitalAndTestData = hospitalAndTestData.slice().reverse();
  const reversedEpicurve = epicurve.slice().reverse();
  const combinedData = reversedHospitalAndTestData
    .map((v, i) => ({
      ...v,
      ...reversedEpicurve[i],
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

export async function getStaticProps(context) {
  const generalData = await dataApi.fetchGeneralData();
  const epicurve = await dataApi.fetchEpicurve();
  const hospitalAndTestData = await dataApi.fetchHospitalAndTestData();
  const versionData = await dataApi.fetchVersionData();
  const combinedData = await fetchCombinedData();

  return {
    props: {
      epicurve,
      hospitalAndTestData,
      generalData,
      combinedData,
      versionData,
    },
  };
}

function parseAndFormatDate(day: string, dateFormat: string) {
  return format(parseISO(day), dateFormat);
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

Number.Value = ({
  children,
  label,
  delta = null,
  className = null,
  precision = 0,
}) => (
  <div className={classNames("p-2 lg:p-4", className)}>
    <div className="flex items-baseline justify-center py-2">
      <div className="font-bold text-2xl lg:text-4xl leading-none">
        {children}
      </div>
      {delta && delta !== 0 ? (
        <div className="text-sm lg:text-lg leading-none -mr-2 pl-2 w-0">
          {delta > 0 ? "+" : ""}
          {delta?.toFixed(precision)}
        </div>
      ) : null}
    </div>

    <div className="text-center z-20 text-sm lg:text-base">{label}</div>
  </div>
);

Number.Chart = ({
  data,
  dataKey,
  color,
  className = null,
  unit = null,
  type = "bar",
}) => {
  const tooltip = (
    <Tooltip
      content={({ payload, active }) => {
        if (!active || payload == null || !payload[0]) return null;

        const value = payload[0].payload[dataKey];
        const dayISO = payload[0].payload?.day;
        const estimatedLabel = payload[0].payload?.estimatedLabel;
        return (
          <div className="relative">
            <div className="p-1 z-20 relative text-center">
              {dayISO && (
                <p className="text-sm">
                  {parseAndFormatDate(dayISO, "dd.MM.yyy")}
                </p>
              )}

              <div className="font-bold">
                {value}
                {unit}
                {estimatedLabel && "*"}
              </div>
              {estimatedLabel && (
                <div className="text-xs">*{estimatedLabel}</div>
              )}
            </div>
            <div className="bg-gray-300 opacity-75 absolute inset-0 z-10"></div>
          </div>
        );
      }}
    />
  );

  return (
    <div className={classNames("h-24 lg:h-32", className)}>
      <ResponsiveContainer>
        {type === "area" ? (
          <AreaChart margin={CHART_MARGINS} data={data}>
            <YAxis hide domain={[0, (dataMax) => dataMax * 1.5]} />
            {tooltip}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              isAnimationActive={false}
              dot={{ stroke: color, fillOpacity: 1 }}
            />
          </AreaChart>
        ) : (
          <BarChart margin={CHART_MARGINS} data={data}>
            {tooltip}
            <Bar
              dataKey={dataKey}
              stroke={color}
              fill={color}
              fillOpacity={0.9}
              strokeWidth={0}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

function NewInfections({ generalData, epicurve, versionData }) {
  const lastEntry = epicurve[epicurve.length - 1];
  const day = parseISO(lastEntry?.day);
  const versionDate = parseISO(versionData.versionDate);
  const isLatestUpdateFromToday = isToday(versionDate);
  const previouslyInfected = epicurve
    .slice(0, isLatestUpdateFromToday ? epicurve.length - 1 : null)
    .reduce((acc, v) => acc + v.cases, 0);

  let newInfections = generalData.allInfections - previouslyInfected;
  let label = `neue Fälle seit ${format(versionDate, "dd.MM.yyyy HH:mm")} Uhr`;
  const reversedEpicurve = epicurve.slice().reverse();
  let data = reversedEpicurve.slice(0, 14).reverse();

  if (isLatestUpdateFromToday) {
    label = `neue Fälle seit ${format(day, "dd.MM.yyy")} 00:00 Uhr`;
    data[data.length - 1] = {
      ...lastEntry,
      cases: newInfections,
      estimatedLabel: "Daten unvollständig",
    };
  } else {
    data = [
      ...data,
      { cases: newInfections, estimatedLabel: "Daten tlw. von Vortag" },
    ];
  }

  return (
    <Number className="bg-blue-100 text-blue-900">
      <Number.Value className="lg:w-1/2 xl:w-2/5" label={label}>
        {newInfections}
      </Number.Value>

      <Number.Chart
        className="w-full lg:w-1/2 xl:w-3/5"
        data={data}
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
  calculateDelta = false,
  showDelta = false,
  unit = null,
  type = "bar",
  days = 14,
  precision = 0,
}) {
  const lastNDays = data.slice().reverse().slice(0, days).reverse();
  const lastValueIsToday = isToday(
    parseISO(lastNDays[lastNDays.length - 1].day)
  );
  const prevValue = lastValueIsToday
    ? lastNDays[lastNDays.length - 2][dataKey]
    : lastNDays[lastNDays.length - 1][dataKey];
  const diffBasis = lastValueIsToday
    ? lastNDays[lastNDays.length - 1][dataKey]
    : value;
  const currentValue = lastNDays[lastNDays.length - 1][dataKey];
  const delta = calculateDelta ? diffBasis - prevValue : currentValue;

  return (
    <Number className={className}>
      <Number.Value
        className="lg:w-1/2 xl:w-2/5"
        delta={showDelta ? delta : null}
        label={label}
        precision={precision}
      >
        {value}
        {unit}
      </Number.Value>

      <Number.Chart
        className="w-full lg:w-1/2 xl:w-3/5"
        data={lastNDays}
        dataKey={dataKey}
        color={color}
        unit={unit}
        type={type}
      />
    </Number>
  );
}

function Dashboard({
  generalData,
  epicurve,
  hospitalAndTestData,
  combinedData,
  versionData,
}) {
  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-2 lg:gap-4 py-1 px-3 lg:py-4 lg:px-4">
        <NewInfections
          generalData={generalData}
          epicurve={epicurve}
          versionData={versionData}
        />

        <CurrentValueWithHistory
          className="bg-blue-100 text-blue-900"
          data={combinedData}
          label="7-Tage-Inzidenz (pro 100.000 Einwohner)"
          value={combinedData[combinedData.length - 1].sevenDay}
          dataKey="sevenDay"
          color={COLORS.blue.dark}
          calculateDelta
          showDelta
          type="area"
        />
        {/* <CurrentValueWithHistory
          className="bg-blue-100 text-blue-900"
          data={combinedData}
          label="7-Tage-Mittel (pro 100.000 Einwohner)"
          value={combinedData[combinedData.length - 1].sevenDayAvgCasesPer100}
          dataKey="sevenDayAvgCasesPer100"
          color={COLORS.blue.dark}
          calculateDelta
          showDelta
          type="area"
          precision={2}
        /> */}
        <CurrentValueWithHistory
          className="bg-green-100 text-green-900"
          data={combinedData}
          label="Ø Testungen pro Tag (7-Tage-Mittel)"
          value={combinedData[combinedData.length - 1].sevenDayAvgTests}
          dataKey="sevenDayAvgTests"
          color={COLORS.green.dark}
          calculateDelta
          showDelta
        />

        <CurrentValueWithHistory
          className="bg-green-100 text-green-900"
          data={combinedData}
          label="Genesen"
          value={generalData.recovered}
          dataKey="recoveredPerDay"
          color={COLORS.green.dark}
          showDelta
        />

        <CurrentValueWithHistory
          className="bg-yellow-100 text-yellow-900"
          data={combinedData.map((v) => ({
            ...v,
            positivityRate: (v.positivityRate * 100).toFixed(2),
          }))}
          label="Positivitätsrate"
          value={(
            combinedData[combinedData.length - 1].positivityRate * 100
          ).toFixed(2)}
          unit="%"
          dataKey="positivityRate"
          color={COLORS.yellow.dark}
          type="area"
        />

        <CurrentValueWithHistory
          className="bg-yellow-100 text-yellow-900"
          data={hospitalAndTestData}
          label="Spital (ohne Intensiv)"
          value={generalData.hospitalized}
          dataKey="hospitalized"
          color={COLORS.yellow.dark}
          calculateDelta
          showDelta
        />

        <CurrentValueWithHistory
          className="bg-red-100 text-red-900"
          data={hospitalAndTestData}
          label="Intensiv"
          value={generalData.icu}
          dataKey="icu"
          color={COLORS.red.dark}
          calculateDelta
          showDelta
        />
        <CurrentValueWithHistory
          className="bg-red-100 text-red-900"
          data={epicurve}
          label="Todesfälle"
          value={epicurve.reduce((acc, v) => v.deathsPerDay + acc, 0)}
          dataKey="deathsPerDay"
          color={COLORS.red.dark}
          showDelta
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
          <Number.Value label="Testungen gesamt">
            {generalData.allTests}
          </Number.Value>
        </Number>
      </div>
    </div>
  );
}

export default function Home({
  epicurve,
  generalData,
  hospitalAndTestData,
  combinedData,
  versionData,
}) {
  return (
    <div className="container mx-auto">
      <Header lastUpdated={generalData.lastUpdated} />
      <Nav />
      <Dashboard
        generalData={generalData}
        epicurve={epicurve}
        hospitalAndTestData={hospitalAndTestData}
        combinedData={combinedData}
        versionData={versionData}
      />
      <Footer />
    </div>
  );
}
